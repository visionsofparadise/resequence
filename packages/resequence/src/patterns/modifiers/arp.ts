import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
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
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly mappingPattern: Pattern,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const total = child.durationTicks;
		const mappingDuration = mappingPattern.durationTicks;

		const pitchPool = [...new Set(child.notes.map((positionedNote) => positionedNote.pitch))].sort((pitchA, pitchB) => pitchA - pitchB);

		if (pitchPool.length === 0 || mappingDuration === 0) {
			this.notes = [];
			return;
		}

		const mappingNotes = mappingPattern.notes.slice().sort((noteA, noteB) => noteA.tick - noteB.tick);

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
			const absoluteTick = cycle * mappingDuration + mappingNote.tick;

			if (absoluteTick >= total) break;

			const poolIndex = mappingNote.pitch % pitchPool.length;
			const pitch = pitchPool[poolIndex] ?? firstPitch;
			result.push({ ...mappingNote, tick: absoluteTick, pitch });

			stepIndex++;

			if (stepIndex % mappingNotes.length === 0) cycle++;
		}

		this.notes = result;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		prepareNotes(this.notes, offsetTicks, this.outputs, context);
		this.child.prepare(offsetTicks, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		scheduleNotes(this.notes, offsetTicks, this.outputs, context);
		this.child.schedule(offsetTicks, context);
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
