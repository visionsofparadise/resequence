import type { MidiData, MidiEvent } from "midi-file";
import { writeMidi } from "midi-file";
import type { MarkerPoint } from "./collect-markers";
import type { TempoPoint } from "./tempo-map";

export interface MidiNote {
	readonly tick: number;
	readonly pitch: number;
	readonly durationTicks: number;
	readonly velocity: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
}

export function encodeMidi(
	tracks: Map<string, ReadonlyArray<MidiNote>>,
	options: { ppq: number; tempoChanges: ReadonlyArray<TempoPoint>; markers: ReadonlyArray<MarkerPoint>; timeSignature?: [number, number] },
): Uint8Array {
	const [numerator, denominator] = options.timeSignature ?? [4, 4];
	const denominatorPower = Math.log2(denominator);

	const tempoChanges = options.tempoChanges.length > 0 ? [...options.tempoChanges] : [{ tick: 0, bpm: 120 }];

	if (tempoChanges[0]!.tick !== 0) {
		tempoChanges.unshift({ tick: 0, bpm: 120 });
	}

	const tempoTimeEvents: Array<{ tick: number; event: MidiEvent }> = [];

	for (const point of tempoChanges) {
		tempoTimeEvents.push({ tick: point.tick, event: { deltaTime: 0, type: "setTempo", microsecondsPerBeat: Math.round(60_000_000 / point.bpm), meta: true } });
	}

	for (const marker of options.markers) {
		tempoTimeEvents.push({ tick: marker.tick, event: { deltaTime: 0, type: "marker", text: marker.name, meta: true } });
	}

	tempoTimeEvents.sort((left, right) => left.tick - right.tick);

	const tempoTrack: Array<MidiEvent> = [
		{ deltaTime: 0, type: "timeSignature", numerator, denominator: denominatorPower, metronome: 24, thirtyseconds: 8, meta: true },
	];

	let lastTick = 0;

	for (const { tick, event } of tempoTimeEvents) {
		event.deltaTime = tick - lastTick;
		lastTick = tick;
		tempoTrack.push(event);
	}

	tempoTrack.push({ deltaTime: 0, type: "endOfTrack", meta: true });

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

		if (mn.cc) {
			for (const [ccKey, ccValue] of Object.entries(mn.cc)) {
				if (ccValue !== undefined) {
					timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "controller", channel: 0, controllerType: Number(ccKey), value: ccValue } });
				}
			}
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
