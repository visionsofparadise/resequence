import type { ScoreNote } from "../patterns/note";
import { CHROMATIC_TUNING } from "../tunings/chromatic";
import type { MidiUnit, VoiceNote, VoiceSlide } from "../units/midi-unit";
import { CC } from "../utils/cc";
import type { Pitch } from "../utils/pitch";
import { denormalizePitch, pitchToCents } from "../utils/pitch";
import type { ResolvedTuning } from "../utils/tuning";
import type { ScheduleContext } from "./schedule-context";
import { beatsToSeconds } from "./tempo-map";

export function isInScope(offsetBeats: number, startBeat: number, endBeat: number, context: ScheduleContext): boolean {
	return offsetBeats + endBeat > context.fromBeats && offsetBeats + startBeat < context.toBeats;
}

export function scheduleNotes(notes: ReadonlyArray<ScoreNote>, offsetBeats: number, outputs: ReadonlyArray<MidiUnit>, scheduleContext: ScheduleContext): void {
	if (outputs.length === 0) return;

	for (const scoreNote of notes) {
		const noteBeat = offsetBeats + scoreNote.startBeat;
		const noteEnd = offsetBeats + scoreNote.endBeat;

		if (noteEnd <= scheduleContext.fromBeats || noteBeat >= scheduleContext.toBeats) continue;

		const voiceNote = buildVoiceNote(scoreNote, noteBeat, scheduleContext);

		for (const node of outputs) {
			node.schedule(voiceNote, scheduleContext);
		}
	}
}

function buildVoiceNote(scoreNote: ScoreNote, absoluteBeat: number, scheduleContext: ScheduleContext): VoiceNote {
	const durationBeats = scoreNote.endBeat - scoreNote.startBeat;
	const startMs = beatsToSeconds(absoluteBeat, scheduleContext.tempoMap) * 1000;
	const stopMs = beatsToSeconds(absoluteBeat + durationBeats, scheduleContext.tempoMap) * 1000;

	const cc = scoreNote.cc;
	const sustainValue = cc?.[CC.SUSTAIN];
	const releaseValue = cc?.[CC.RELEASE];
	const sustainOn = sustainValue !== undefined && sustainValue >= 64;
	const releaseMs = !sustainOn && releaseValue !== undefined ? (releaseValue / 127) * 4000 : 0;

	const frequency = pitchToFrequency(scoreNote.pitch, scheduleContext);
	const { note, bend } = frequencyToNoteAndBend(frequency);

	let slides: ReadonlyArray<VoiceSlide> | undefined;
	if (scoreNote.slides && scoreNote.slides.length > 0) {
		slides = scoreNote.slides.map((slide) => {
			const slideAbsoluteBeat = absoluteBeat + slide.beat;
			const slideTimeMs = beatsToSeconds(slideAbsoluteBeat, scheduleContext.tempoMap) * 1000;
			const slidePitch = denormalizePitch(slide.value, scoreNote.pitch.stepsPerOctave, scoreNote.pitch.octaveRatio);
			const cents = pitchToCents(scoreNote.pitch, slidePitch, scheduleContext.tuning);
			return { timeMs: slideTimeMs - startMs, cents, curve: slide.curve ?? 0 };
		});
	}

	return {
		note,
		bend,
		velocity: scoreNote.velocity,
		startMs,
		stopMs,
		cleanupMs: stopMs + releaseMs + 500,
		lyric: scoreNote.lyric,
		pitch: scoreNote.pitch,
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

function pitchToFrequency(pitch: Pitch, scheduleContext: ScheduleContext): number {
	const tuning: ResolvedTuning = scheduleContext.tuning ?? CHROMATIC_TUNING;

	const className = tuning.classes[pitch.class];
	const baseHz = className !== undefined ? tuning.frequencies[className] : undefined;

	if (baseHz !== undefined) {
		return baseHz * Math.pow(tuning.octaveRatio, pitch.octave - tuning.referenceOctave);
	}

	// Pitch class not in tuning — map fractional octave position into tuning's frequency space
	const rootName = tuning.classes[0];
	const rootHz = rootName !== undefined ? (tuning.frequencies[rootName] ?? 0) : 0;
	const fraction = pitch.class / pitch.stepsPerOctave;
	return rootHz * Math.pow(tuning.octaveRatio, fraction + (pitch.octave - tuning.referenceOctave));
}

function frequencyToNoteAndBend(frequency: number): { note: number; bend: number } {
	const midiFloat = 69 + 12 * Math.log2(frequency / 440);
	const note = Math.round(midiFloat);
	const bend = (midiFloat - note) * 100;

	return { note, bend };
}
