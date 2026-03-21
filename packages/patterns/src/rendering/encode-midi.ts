import type { MidiData, MidiEvent } from "midi-file";
import { writeMidi } from "midi-file";

export interface MidiPitchBend {
	readonly tick: number;
	readonly bend: number;
}

export interface MidiNote {
	readonly tick: number;
	readonly note: number;
	readonly bend?: number;
	readonly durationTicks: number;
	readonly velocity: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
	readonly pitchBends?: ReadonlyArray<MidiPitchBend>;
}

export interface EncodeMidiOptions {
	readonly ppq: number;
	readonly tempoChanges?: ReadonlyArray<{ beat: number; bpm: number }>;
	readonly markers?: ReadonlyArray<{ beat: number; name: string }>;
	readonly timeSignatureChanges?: ReadonlyArray<{ beat: number; timeSignature: readonly [number, number] }>;
}

export function encodeMidi(tracks: Map<string, ReadonlyArray<MidiNote>>, options: EncodeMidiOptions): Uint8Array {
	const tempoChanges = options.tempoChanges && options.tempoChanges.length > 0 ? [...options.tempoChanges] : [{ beat: 0, bpm: 120 }];

	if ((tempoChanges[0]?.beat ?? 0) !== 0) {
		tempoChanges.unshift({ beat: 0, bpm: 120 });
	}

	const timeSigChanges = options.timeSignatureChanges && options.timeSignatureChanges.length > 0 ? [...options.timeSignatureChanges] : [{ beat: 0, timeSignature: [4, 4] as const }];

	if ((timeSigChanges[0]?.beat ?? 0) !== 0) {
		timeSigChanges.unshift({ beat: 0, timeSignature: [4, 4] as const });
	}

	const tempoTimeEvents: Array<{ tick: number; event: MidiEvent }> = [];

	for (const point of tempoChanges) {
		tempoTimeEvents.push({ tick: Math.round(point.beat * options.ppq), event: { deltaTime: 0, type: "setTempo", microsecondsPerBeat: Math.round(60_000_000 / point.bpm), meta: true } });
	}

	for (const marker of options.markers ?? []) {
		tempoTimeEvents.push({ tick: Math.round(marker.beat * options.ppq), event: { deltaTime: 0, type: "marker", text: marker.name, meta: true } });
	}

	for (const point of timeSigChanges) {
		const [numerator, denominator] = point.timeSignature;
		const denominatorPower = Math.log2(denominator);

		tempoTimeEvents.push({
			tick: Math.round(point.beat * options.ppq),
			event: { deltaTime: 0, type: "timeSignature", numerator, denominator: denominatorPower, metronome: 24, thirtyseconds: 8, meta: true },
		});
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

	const needsMultiChannel = hasOverlappingSlides(notes);
	const channelAssignments = needsMultiChannel ? allocateChannels(notes) : undefined;
	const bendRanges = calculateBendRanges(notes, channelAssignments);

	const timeEvents: Array<{ tick: number; event: MidiEvent }> = [];

	for (const [channel, bendRange] of bendRanges) {
		if (bendRange > 2) {
			timeEvents.push({ tick: 0, event: { deltaTime: 0, type: "controller", channel, controllerType: 101, value: 0 } });
			timeEvents.push({ tick: 0, event: { deltaTime: 0, type: "controller", channel, controllerType: 100, value: 0 } });
			timeEvents.push({ tick: 0, event: { deltaTime: 0, type: "controller", channel, controllerType: 6, value: bendRange } });
			timeEvents.push({ tick: 0, event: { deltaTime: 0, type: "controller", channel, controllerType: 38, value: 0 } });
			timeEvents.push({ tick: 0, event: { deltaTime: 0, type: "controller", channel, controllerType: 101, value: 127 } });
			timeEvents.push({ tick: 0, event: { deltaTime: 0, type: "controller", channel, controllerType: 100, value: 127 } });
		}
	}

	for (const [noteIndex, mn] of notes.entries()) {
		const channel = channelAssignments?.get(noteIndex) ?? 0;
		const bendRange = bendRanges.get(channel) ?? 2;

		if (mn.pitchBends && mn.pitchBends.length > 0) {
			for (const pb of mn.pitchBends) {
				const bendValue = centsToBendValue(pb.bend, bendRange);

				timeEvents.push({ tick: pb.tick, event: { deltaTime: 0, type: "pitchBend", channel, value: bendValue } });
			}

			const noteEndTick = mn.tick + mn.durationTicks;

			timeEvents.push({ tick: noteEndTick, event: { deltaTime: 0, type: "pitchBend", channel, value: 8192 } });
		} else if (mn.bend !== undefined) {
			const bendValue = centsToBendValue(mn.bend, bendRange);

			timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "pitchBend", channel, value: bendValue } });
		}

		if (mn.lyric) {
			timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "lyrics", text: mn.lyric, meta: true } });
		}

		if (mn.cc) {
			for (const [ccKey, ccValue] of Object.entries(mn.cc)) {
				if (ccValue !== undefined) {
					timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "controller", channel, controllerType: Number(ccKey), value: ccValue } });
				}
			}
		}

		timeEvents.push({ tick: mn.tick, event: { deltaTime: 0, type: "noteOn", channel, noteNumber: mn.note, velocity: mn.velocity } });
		timeEvents.push({ tick: mn.tick + mn.durationTicks, event: { deltaTime: 0, type: "noteOff", channel, noteNumber: mn.note, velocity: 0 } });
	}

	timeEvents.sort((left, right) => left.tick - right.tick);

	let prevTick = 0;

	for (const { tick, event } of timeEvents) {
		event.deltaTime = tick - prevTick;
		prevTick = tick;
		events.push(event);
	}

	events.push({ deltaTime: 0, type: "endOfTrack", meta: true });

	return events;
}

function centsToBendValue(cents: number, bendRangeSemitones: number): number {
	return Math.max(0, Math.min(16383, Math.round((cents / (bendRangeSemitones * 100)) * 8191 + 8192)));
}

function hasOverlappingSlides(notes: ReadonlyArray<MidiNote>): boolean {
	const sliding = notes.filter((mn) => mn.pitchBends && mn.pitchBends.length > 0).sort((na, nb) => na.tick - nb.tick);

	for (let ni = 0; ni < sliding.length; ni++) {
		const noteA = sliding[ni];

		if (!noteA) continue;
		const aEnd = noteA.tick + noteA.durationTicks;

		for (let nj = ni + 1; nj < sliding.length; nj++) {
			const noteB = sliding[nj];

			if (!noteB || noteB.tick >= aEnd) break;

			return true;
		}
	}

	return false;
}

function allocateChannels(notes: ReadonlyArray<MidiNote>): Map<number, number> {
	const assignments = new Map<number, number>();
	const channelFreeAt: Array<number> = Array.from({ length: 16 }, () => 0);

	const sorted = notes.map((mn, originalIndex) => ({ mn, originalIndex })).sort((sa, sb) => sa.mn.tick - sb.mn.tick);

	for (const { mn, originalIndex } of sorted) {
		if (!mn.pitchBends || mn.pitchBends.length === 0) {
			assignments.set(originalIndex, 0);
			continue;
		}

		let assignedChannel = 0;

		for (let ch = 0; ch < 16; ch++) {
			if (ch === 9) continue;
			if ((channelFreeAt[ch] ?? 0) <= mn.tick) {
				assignedChannel = ch;
				break;
			}
		}

		assignments.set(originalIndex, assignedChannel);
		channelFreeAt[assignedChannel] = mn.tick + mn.durationTicks;
	}

	return assignments;
}

function calculateBendRanges(notes: ReadonlyArray<MidiNote>, channelAssignments?: Map<number, number>): Map<number, number> {
	const maxCentsPerChannel = new Map<number, number>();

	for (const [noteIndex, mn] of notes.entries()) {
		const channel = channelAssignments?.get(noteIndex) ?? 0;

		if (mn.pitchBends) {
			for (const pb of mn.pitchBends) {
				const absCents = Math.abs(pb.bend);
				const current = maxCentsPerChannel.get(channel) ?? 0;

				if (absCents > current) maxCentsPerChannel.set(channel, absCents);
			}
		}

		if (mn.bend !== undefined) {
			const absCents = Math.abs(mn.bend);
			const current = maxCentsPerChannel.get(channel) ?? 0;

			if (absCents > current) maxCentsPerChannel.set(channel, absCents);
		}
	}

	const ranges = new Map<number, number>();

	for (const [channel, maxCents] of maxCentsPerChannel) {
		const semitones = Math.ceil(maxCents / 100);

		ranges.set(channel, Math.max(2, semitones));
	}

	if (!ranges.has(0)) ranges.set(0, 2);

	return ranges;
}
