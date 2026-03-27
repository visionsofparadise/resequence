import type { Keyframe, NoteEvent as PatternNoteEvent, TempoMap } from "@resequence/patterns";
import { beatsToSeconds, denormalizePitch, pitchToCents } from "@resequence/patterns";
import type { NoteSlide, NoteEvent as UnitNoteEvent } from "@resequence/web-au-core";
import { CC } from "@resequence/web-au-utils";

export function mapNoteEvent(event: PatternNoteEvent, tempoMap: TempoMap): UnitNoteEvent {
	const startMs = beatsToSeconds(event.startBeat, tempoMap) * 1000;
	const stopMs = beatsToSeconds(event.startBeat + event.durationBeats, tempoMap) * 1000;

	const cc = event.cc;
	const sustainValue = cc?.[CC.SUSTAIN];
	const releaseValue = cc?.[CC.RELEASE];
	const sustainOn = sustainValue !== undefined && sustainValue >= 64;
	const releaseMs = !sustainOn && releaseValue !== undefined ? (releaseValue / 127) * 4000 : 0;

	let slides: ReadonlyArray<NoteSlide> | undefined;

	if (event.slides && event.slides.length > 0) {
		slides = mapSlides(event.slides, event, startMs, tempoMap);
	}

	return {
		note: event.midiNote,
		bend: event.bend,
		velocity: event.velocity,
		frequency: event.frequency,
		startMs,
		stopMs,
		cleanupMs: stopMs + releaseMs + 500,
		slides,
		attack: cc?.[CC.ATTACK],
		release: cc?.[CC.RELEASE],
		sustain: cc?.[CC.SUSTAIN],
		cutoff: cc?.[CC.CUTOFF],
		resonance: cc?.[CC.RESONANCE],
		volume: cc?.[CC.VOLUME],
		expression: cc?.[CC.EXPRESSION],
		pan: cc?.[CC.PAN],
		chorus: cc?.[CC.CHORUS],
		reverb: cc?.[CC.REVERB],
		cc,
	};
}

function mapSlides(slides: ReadonlyArray<Keyframe>, event: PatternNoteEvent, startMs: number, tempoMap: TempoMap): ReadonlyArray<NoteSlide> {
	return slides.map((slide) => {
		const slideAbsoluteBeat = event.startBeat + slide.beat;
		const slideTimeMs = beatsToSeconds(slideAbsoluteBeat, tempoMap) * 1000;
		const slidePitch = denormalizePitch(slide.value, event.pitch.stepsPerOctave, event.pitch.octaveRatio);
		const cents = pitchToCents(event.pitch, slidePitch, event.tuning);

		return { timeMs: slideTimeMs - startMs, cents, curve: slide.curve ?? 0 };
	});
}
