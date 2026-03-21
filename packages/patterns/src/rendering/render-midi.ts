import type { Event, NoteEvent } from "../events";
import type { Pattern } from "../patterns/pattern";
import { pitchToMidi } from "../pitch";
import { evaluateSlideCents } from "../utils/slide";
import type { MidiNote, MidiPitchBend } from "./encode-midi";
import { encodeMidi } from "./encode-midi";

const DEFAULT_PPQ = 480;

export function renderMidi(pattern: Pattern, options?: { ppq?: number }): Map<string, Uint8Array> {
	const ppq = options?.ppq ?? DEFAULT_PPQ;

	const allEvents = pattern.schedule(0, -Infinity, Infinity);

	const noteEvents = allEvents.filter((ev): ev is NoteEvent => ev.type === "note");

	const grouped = new Map<string, Array<MidiNote>>();

	for (const ne of noteEvents) {
		let track = grouped.get(ne.port);

		if (!track) {
			track = [];
			grouped.set(ne.port, track);
		}

		const { note: midiNote, bend } = pitchToMidi(ne.pitch, ne.tuning);

		const tick = Math.round(ne.startBeat * ppq);
		const durationTicks = Math.round(ne.durationBeats * ppq);

		let pitchBends: ReadonlyArray<MidiPitchBend> | undefined;

		if (ne.slides && ne.slides.length > 0) {
			const sampleInterval = 10;
			const bends: Array<MidiPitchBend> = [];

			for (let tickOffset = 0; tickOffset <= durationTicks; tickOffset += sampleInterval) {
				const beatOffset = tickOffset / ppq;
				const slideCents = evaluateSlideCents(ne.pitch, ne.slides, beatOffset, ne.tuning);
				const totalCents = (bend || 0) + slideCents;

				bends.push({ tick: tick + tickOffset, bend: totalCents });
			}

			pitchBends = bends;
		}

		track.push({
			tick,
			note: midiNote,
			bend: !pitchBends && bend !== 0 ? bend : undefined,
			durationTicks,
			velocity: ne.velocity,
			lyric: ne.lyric,
			cc: ne.cc,
			pitchBends,
		});
	}

	const result = new Map<string, Uint8Array>();

	for (const [portKey, notes] of grouped) {
		const singleTrack = new Map([[portKey, notes]]);

		result.set(portKey, encodeMidi(singleTrack, { ppq }));
	}

	return result;
}

export function renderAllEvents(pattern: Pattern): Array<Event> {
	return pattern.schedule(0, -Infinity, Infinity);
}
