import { I } from "../../tunings/index-tuning";
import type { Pitch } from "../../utils/pitch";
import { pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { sequence } from "../sequence";
import { collectNotes, flatMapNotes } from "../utils/tree";

function mulberry32(seed: number): () => number {
	let state = seed;

	return function (): number {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

interface ArpStep {
	readonly absoluteBeat: number;
	readonly pitch: Pitch;
	readonly velocity: number;
	readonly duration: number;
}

export class ArpPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly mapping: Pattern,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): ArpPattern {
		return new ArpPattern(this.source, this.mapping, this.overrideNode(overrides));
	}
}

export function arp(pattern: Pattern, mappingPattern: Pattern): ArpPattern {
	const sourceNotes = collectNotes(pattern);
	const mappingNotes = collectNotes(mappingPattern).sort((noteA, noteB) => noteA.startBeat - noteB.startBeat);

	const mappingDuration = mappingPattern.endBeat - mappingPattern.startBeat;

	if (sourceNotes.length === 0 || mappingNotes.length === 0 || mappingDuration === 0) {
		return new ArpPattern(pattern, mappingPattern, { notes: [], children: [{ offsetBeats: 0, pattern }], startBeat: pattern.startBeat, endBeat: pattern.endBeat });
	}

	const mappingPitchKeys = [...new Set(mappingNotes.map((mappingNote) => pitchKey(mappingNote.pitch)))].sort((keyA, keyB) => keyA - keyB);
	const mappingPitchRank = new Map(mappingPitchKeys.map((key, index) => [key, index]));

	const events: Array<{ beat: number; delta: number }> = [];

	for (const source of sourceNotes) {
		events.push({ beat: source.startBeat, delta: 1 });
		events.push({ beat: source.endBeat, delta: -1 });
	}

	events.sort((eventA, eventB) => eventA.beat - eventB.beat || eventB.delta - eventA.delta);

	const segments: Array<{ start: number; end: number }> = [];
	let activeCount = 0;
	let segmentStart = 0;

	for (const event of events) {
		if (activeCount === 0 && event.delta > 0) segmentStart = event.beat;

		activeCount += event.delta;

		if (activeCount === 0) segments.push({ start: segmentStart, end: event.beat });
	}

	const stepsByNote = new Map<string, Array<ArpStep>>();

	for (const segment of segments) {
		let cycle = 0;
		let stepIndex = 0;

		for (;;) {
			const mappingNote = mappingNotes[stepIndex % mappingNotes.length];
			if (!mappingNote) break;
			const absoluteBeat = segment.start + cycle * mappingDuration + mappingNote.startBeat;

			if (absoluteBeat >= segment.end) break;

			const heldPitches = new Map<number, Pitch>();

			for (const source of sourceNotes) {
				if (source.startBeat <= absoluteBeat && source.endBeat > absoluteBeat) {
					const key = pitchKey(source.pitch);

					if (!heldPitches.has(key)) heldPitches.set(key, source.pitch);
				}
			}

			if (heldPitches.size > 0) {
				const pool = [...heldPitches.entries()].sort((entryA, entryB) => entryA[0] - entryB[0]).map(([, pitch]) => pitch);

				const lowestPitch = pool[0];

				if (!lowestPitch) {
					stepIndex++;

					if (stepIndex % mappingNotes.length === 0) cycle++;

					continue;
				}

				const rank = mappingPitchRank.get(pitchKey(mappingNote.pitch)) ?? 0;
				const selectedPitch = pool[rank] ?? lowestPitch;
				const selectedKey = pitchKey(selectedPitch);
				const stepDuration = mappingNote.endBeat - mappingNote.startBeat;

				for (const source of sourceNotes) {
					if (pitchKey(source.pitch) === selectedKey && source.startBeat <= absoluteBeat && source.endBeat > absoluteBeat) {
						const noteId = `${source.startBeat}:${source.endBeat}:${selectedKey}`;
						let steps = stepsByNote.get(noteId);

						if (!steps) {
							steps = [];
							stepsByNote.set(noteId, steps);
						}

						steps.push({ absoluteBeat, pitch: selectedPitch, velocity: mappingNote.velocity, duration: stepDuration });

						break;
					}
				}
			}

			stepIndex++;

			if (stepIndex % mappingNotes.length === 0) cycle++;
		}
	}

	// Walk the tree in-place, replacing each note with its assigned arp steps
	const transformed = flatMapNotes(pattern, (scoreNote, absoluteOffset) => {
		const absStart = absoluteOffset + scoreNote.startBeat;
		const absEnd = absoluteOffset + scoreNote.endBeat;
		const noteId = `${absStart}:${absEnd}:${pitchKey(scoreNote.pitch)}`;
		const steps = stepsByNote.get(noteId);

		if (!steps || steps.length === 0) return [];

		return steps.map((step) => ({
			pitch: step.pitch,
			startBeat: step.absoluteBeat - absoluteOffset,
			endBeat: step.absoluteBeat - absoluteOffset + step.duration,
			velocity: step.velocity,
		}));
	});

	return new ArpPattern(pattern, mappingPattern, transformed);
}

export function arpUp(voices: number, rate: number): Pattern {
	const steps: Array<ScoreNote> = [];
	for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
		steps.push(I(voiceIndex)(rate));
	}
	return sequence(...steps);
}

export function arpDown(voices: number, rate: number): Pattern {
	const steps: Array<ScoreNote> = [];
	for (let voiceIndex = voices - 1; voiceIndex >= 0; voiceIndex--) {
		steps.push(I(voiceIndex)(rate));
	}
	return sequence(...steps);
}

export function arpUpDown(voices: number, rate: number): Pattern {
	const steps: Array<ScoreNote> = [];
	for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
		steps.push(I(voiceIndex)(rate));
	}
	for (let voiceIndex = voices - 2; voiceIndex >= 1; voiceIndex--) {
		steps.push(I(voiceIndex)(rate));
	}
	return sequence(...steps);
}

export function arpRandom(voices: number, rate: number, seed?: number): Pattern {
	const rng = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);
	const steps: Array<ScoreNote> = [];
	for (let stepIndex = 0; stepIndex < voices; stepIndex++) {
		steps.push(I(Math.floor(rng() * voices))(rate));
	}
	return sequence(...steps);
}
