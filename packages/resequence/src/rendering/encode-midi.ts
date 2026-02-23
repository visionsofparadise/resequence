import type { MidiData, MidiEvent } from "midi-file";
import { writeMidi } from "midi-file";

export interface MidiNote {
	readonly tick: number;
	readonly pitch: number;
	readonly durationTicks: number;
	readonly velocity: number;
	readonly lyric?: string;
}

export function encodeMidi(tracks: Map<string, ReadonlyArray<MidiNote>>, options: { ppq: number; tempo: number; timeSignature?: [number, number] }): Uint8Array {
	const microsecondsPerBeat = Math.round(60_000_000 / options.tempo);
	const [numerator, denominator] = options.timeSignature ?? [4, 4];
	const denominatorPower = Math.log2(denominator);

	const tempoTrack: Array<MidiEvent> = [
		{ deltaTime: 0, type: "setTempo", microsecondsPerBeat, meta: true },
		{ deltaTime: 0, type: "timeSignature", numerator, denominator: denominatorPower, metronome: 24, thirtyseconds: 8, meta: true },
		{ deltaTime: 0, type: "endOfTrack", meta: true },
	];

	const noteTracks: Array<Array<MidiEvent>> = [];

	for (const [name, notes] of tracks) {
		const events = buildTrackEvents(name, notes);
		noteTracks.push(events);
	}

	const data: MidiData = {
		header: {
			format: 1,
			numTracks: 1 + noteTracks.length,
			ticksPerBeat: options.ppq,
		},
		tracks: [tempoTrack, ...noteTracks],
	};

	return new Uint8Array(writeMidi(data));
}

function buildTrackEvents(name: string, notes: ReadonlyArray<MidiNote>): Array<MidiEvent> {
	const events: Array<MidiEvent> = [{ deltaTime: 0, type: "trackName", text: name, meta: true }];

	const timeEvents: Array<{ tick: number; event: MidiEvent }> = [];

	for (const mn of notes) {
		if (mn.lyric) {
			timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "lyrics", text: mn.lyric, meta: true } });
		}

		timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "noteOn", channel: 0, noteNumber: mn.pitch, velocity: mn.velocity } });
		timeEvents.push({ tick: mn.tick + mn.durationTicks, event: { deltaTime: 0, type: "noteOff", channel: 0, noteNumber: mn.pitch, velocity: 0 } });
	}

	timeEvents.sort((left, right) => left.tick - right.tick);

	let lastTick = 0;

	for (const { tick, event } of timeEvents) {
		event.deltaTime = tick - lastTick;
		lastTick = tick;
		events.push(event);
	}

	events.push({ deltaTime: 0, type: "endOfTrack", meta: true });

	return events;
}
