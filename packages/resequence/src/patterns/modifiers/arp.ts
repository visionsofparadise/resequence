import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import type { Pitch } from "../../utils/pitch";
import { pitchKey } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import { note } from "../note";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";
import { sequence } from "../sequence";

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

export class ArpPattern extends MidiPattern {
	readonly type = "arp" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly mappingPattern: Pattern,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const total = child.durationBeats;
		const mappingDuration = mappingPattern.durationBeats;

		const seen = new Set<number>();
		const pitchPool: Array<Pitch> = [];
		for (const positionedNote of child.notes) {
			const key = pitchKey(positionedNote.pitch);
			if (!seen.has(key)) { seen.add(key); pitchPool.push(positionedNote.pitch); }
		}
		pitchPool.sort((pitchA, pitchB) => pitchKey(pitchA) - pitchKey(pitchB));

		if (pitchPool.length === 0 || mappingDuration === 0) {
			this.notes = [];
			return;
		}

		const mappingNotes = mappingPattern.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat);

		if (mappingNotes.length === 0) {
			this.notes = [];
			return;
		}

		const firstMappingNote = mappingNotes[0];
		const firstPitch = pitchPool[0];

		if (firstMappingNote === undefined || firstPitch === undefined) {
			this.notes = [];
			return;
		}

		const result: Array<PositionedNote> = [];
		let cycle = 0;
		let stepIndex = 0;

		for (;;) {
			const mappingNote = mappingNotes[stepIndex % mappingNotes.length] ?? firstMappingNote;
			const absoluteTick = cycle * mappingDuration + mappingNote.beat;

			if (absoluteTick >= total) break;

			const poolIndex = ((pitchKey(mappingNote.pitch) % pitchPool.length) + pitchPool.length) % pitchPool.length;
			const pitch = pitchPool[poolIndex] ?? firstPitch;
			result.push({ ...mappingNote, beat: absoluteTick, pitch });

			stepIndex++;

			if (stepIndex % mappingNotes.length === 0) cycle++;
		}

		this.notes = result;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		prepareNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.prepare(offsetBeats, context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.schedule(offsetBeats, context);
	}
}

export function arp(pattern: Pattern, mappingPattern: Pattern): ArpPattern {
	return new ArpPattern(pattern, mappingPattern);
}

export function arpUp(voices: number, rate: Duration | number): Pattern {
	const steps: Array<Pattern> = [];

	for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
		steps.push(note(voiceIndex, rate));
	}

	return sequence(...steps);
}

export function arpDown(voices: number, rate: Duration | number): Pattern {
	const steps: Array<Pattern> = [];

	for (let voiceIndex = voices - 1; voiceIndex >= 0; voiceIndex--) {
		steps.push(note(voiceIndex, rate));
	}

	return sequence(...steps);
}

export function arpUpDown(voices: number, rate: Duration | number): Pattern {
	const steps: Array<Pattern> = [];

	for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
		steps.push(note(voiceIndex, rate));
	}

	for (let voiceIndex = voices - 2; voiceIndex >= 1; voiceIndex--) {
		steps.push(note(voiceIndex, rate));
	}

	return sequence(...steps);
}

export function arpRandom(voices: number, rate: Duration | number, seed?: number): Pattern {
	const rng = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);
	const steps: Array<Pattern> = [];

	for (let stepIndex = 0; stepIndex < voices; stepIndex++) {
		steps.push(note(Math.floor(rng() * voices), rate));
	}

	return sequence(...steps);
}
