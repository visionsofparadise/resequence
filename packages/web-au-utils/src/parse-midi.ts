import { parseMidi as decodeMidi } from "midi-file";
import { CC } from "./cc";
import { type TempoPoint, tickToMs } from "./tempo-map";
import type { NoteEvent, NoteSlide } from "@resequence/web-au-core";

interface PendingNote {
	readonly startTick: number;
	readonly note: number;
	readonly velocity: number;
	readonly channel: number;
}

interface TimedCC {
	readonly tick: number;
	readonly controller: number;
	readonly value: number;
}

interface TimedBend {
	readonly tick: number;
	readonly value: number;
}

export function parseMidiFile(data: Uint8Array): Array<NoteEvent> {
	const midi = decodeMidi(data);
	const ppq = midi.header.ticksPerBeat ?? 480;

	const tempoMap: Array<TempoPoint> = [];
	const pending = new Map<string, PendingNote>();
	const notes: Array<{ pending: PendingNote; stopTick: number }> = [];
	const ccEvents: Array<TimedCC & { channel: number }> = [];
	const bendEvents: Array<TimedBend & { channel: number }> = [];

	for (const track of midi.tracks) {
		let tick = 0;

		for (const event of track) {
			tick += event.deltaTime;

			if (event.type === "setTempo") {
				tempoMap.push({ tick, bpm: 60000000 / event.microsecondsPerBeat });
			} else if (event.type === "noteOn" && event.velocity > 0) {
				const key = `${event.channel}-${event.noteNumber}`;

				pending.set(key, {
					startTick: tick,
					note: event.noteNumber,
					velocity: event.velocity,
					channel: event.channel,
				});
			} else if (event.type === "noteOff" || (event.type === "noteOn" && event.velocity === 0)) {
				const key = `${event.channel}-${event.noteNumber}`;
				const note = pending.get(key);

				if (note) {
					notes.push({ pending: note, stopTick: tick });
					pending.delete(key);
				}
			} else if (event.type === "controller") {
				ccEvents.push({ tick, controller: event.controllerType, value: event.value, channel: event.channel });
			} else if (event.type === "pitchBend") {
				bendEvents.push({ tick, value: event.value, channel: event.channel });
			}
		}
	}

	tempoMap.sort((first, second) => first.tick - second.tick);

	return notes.map(({ pending: note, stopTick }) => {
		const startMs = tickToMs(note.startTick, tempoMap, ppq);
		const stopMs = tickToMs(stopTick, tempoMap, ppq);
		const frequency = 440 * 2 ** ((note.note - 69) / 12);

		const channelCCs = ccEvents.filter(
			(cc) => cc.channel === note.channel && cc.tick >= note.startTick && cc.tick <= stopTick,
		);

		const ccValues: Partial<Record<number, number>> = {};

		for (const cc of channelCCs) {
			ccValues[cc.controller] = cc.value;
		}

		const channelBends = bendEvents.filter(
			(bend) => bend.channel === note.channel && bend.tick >= note.startTick && bend.tick <= stopTick,
		);

		let slides: ReadonlyArray<NoteSlide> | undefined;

		if (channelBends.length > 0) {
			slides = channelBends.map((bend) => ({
				timeMs: tickToMs(bend.tick, tempoMap, ppq) - startMs,
				cents: (bend.value / 8192) * 200,
				curve: 0,
			}));
		}

		const result: NoteEvent = {
			startMs,
			stopMs,
			cleanupMs: stopMs,
			note: note.note,
			velocity: note.velocity,
			bend: 0,
			frequency,
			...(ccValues[CC.ATTACK] !== undefined && { attack: ccValues[CC.ATTACK] }),
			...(ccValues[CC.RELEASE] !== undefined && { release: ccValues[CC.RELEASE] }),
			...(ccValues[CC.SUSTAIN] !== undefined && { sustain: ccValues[CC.SUSTAIN] }),
			...(ccValues[CC.CUTOFF] !== undefined && { cutoff: ccValues[CC.CUTOFF] }),
			...(ccValues[CC.RESONANCE] !== undefined && { resonance: ccValues[CC.RESONANCE] }),
			...(ccValues[CC.VOLUME] !== undefined && { volume: ccValues[CC.VOLUME] }),
			...(ccValues[CC.EXPRESSION] !== undefined && { expression: ccValues[CC.EXPRESSION] }),
			...(ccValues[CC.PAN] !== undefined && { pan: ccValues[CC.PAN] }),
			...(ccValues[CC.CHORUS] !== undefined && { chorus: ccValues[CC.CHORUS] }),
			...(ccValues[CC.REVERB] !== undefined && { reverb: ccValues[CC.REVERB] }),
			...(slides && { slides }),
		};

		return result;
	});
}
