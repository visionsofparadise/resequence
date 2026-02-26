import type { MidiData, MidiEvent } from "midi-file";
import { writeMidi } from "midi-file";
import type { MarkerPoint } from "./collect-markers";
import type { TempoPoint, TimeSignaturePoint } from "./tempo-map";
import { PPQ } from "../utils/duration";

export interface MidiNote {
	readonly tick: number;
	readonly note: number;
	readonly bend?: number;
	readonly durationTicks: number;
	readonly velocity: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
}

export function encodeMidi(
	tracks: Map<string, ReadonlyArray<MidiNote>>,
	options: { ppq: number; tempoChanges: ReadonlyArray<TempoPoint>; markers: ReadonlyArray<MarkerPoint>; timeSignatureChanges?: ReadonlyArray<TimeSignaturePoint> },
): Uint8Array {
	const tempoChanges = options.tempoChanges.length > 0 ? [...options.tempoChanges] : [{ beat: 0, bpm: 120 }];

	if ((tempoChanges[0]?.beat ?? 0) !== 0) {
		tempoChanges.unshift({ beat: 0, bpm: 120 });
	}

	const timeSigChanges = options.timeSignatureChanges && options.timeSignatureChanges.length > 0
		? [...options.timeSignatureChanges]
		: [{ beat: 0, timeSignature: [4, 4] as const }];

	if ((timeSigChanges[0]?.beat ?? 0) !== 0) {
		timeSigChanges.unshift({ beat: 0, timeSignature: [4, 4] as const });
	}

	const tempoTimeEvents: Array<{ tick: number; event: MidiEvent }> = [];

	for (const point of tempoChanges) {
		tempoTimeEvents.push({ tick: Math.round(point.beat * PPQ), event: { deltaTime: 0, type: "setTempo", microsecondsPerBeat: Math.round(60_000_000 / point.bpm), meta: true } });
	}

	for (const marker of options.markers) {
		tempoTimeEvents.push({ tick: Math.round(marker.beat * PPQ), event: { deltaTime: 0, type: "marker", text: marker.name, meta: true } });
	}

	for (const point of timeSigChanges) {
		const [numerator, denominator] = point.timeSignature;
		const denominatorPower = Math.log2(denominator);
		tempoTimeEvents.push({ tick: Math.round(point.beat * PPQ), event: { deltaTime: 0, type: "timeSignature", numerator, denominator: denominatorPower, metronome: 24, thirtyseconds: 8, meta: true } });
	}

	tempoTimeEvents.sort((left, right) => left.tick - right.tick);

	const tempoTrack: Array<MidiEvent> = [];

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
		if (mn.bend !== undefined) {
			const bendValue = Math.round((mn.bend / 200) * 8191 + 8192);
			timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "pitchBend", channel: 0, value: bendValue } });
		}

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

		timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "noteOn", channel: 0, noteNumber: mn.note, velocity: mn.velocity } });
		timeEvents.push({ tick: mn.tick + mn.durationTicks, event: { deltaTime: 0, type: "noteOff", channel: 0, noteNumber: mn.note, velocity: 0 } });
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
