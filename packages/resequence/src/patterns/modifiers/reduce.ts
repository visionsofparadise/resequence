import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export type ReduceFn = (acc: Array<PositionedNote>, positionedNote: PositionedNote, noteIndex: number, all: ReadonlyArray<PositionedNote>) => Array<PositionedNote>;

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

export class ReducePattern extends MidiPattern {
	readonly type = "reduce" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly callback: ReduceFn,
	) {
		super();

		this.durationTicks = child.durationTicks;
		this.notes = child.notes.reduce<Array<PositionedNote>>(callback, []);
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

export function reduce(pattern: Pattern, callback: ReduceFn): ReducePattern {
	return new ReducePattern(pattern, callback);
}

export function map(pattern: Pattern, callback: (positionedNote: PositionedNote, noteIndex: number, all: ReadonlyArray<PositionedNote>) => PositionedNote): ReducePattern {
	return reduce(pattern, (acc, positionedNote, noteIndex, all) => {
		acc.push(callback(positionedNote, noteIndex, all));
		return acc;
	});
}

export function filter(pattern: Pattern, callback: (positionedNote: PositionedNote, noteIndex: number, all: ReadonlyArray<PositionedNote>) => boolean): ReducePattern {
	return reduce(pattern, (acc, positionedNote, noteIndex, all) => {
		if (callback(positionedNote, noteIndex, all)) {
			acc.push(positionedNote);
		}
		return acc;
	});
}

export function flatMap(pattern: Pattern, callback: (positionedNote: PositionedNote, noteIndex: number, all: ReadonlyArray<PositionedNote>) => ReadonlyArray<PositionedNote>): ReducePattern {
	return reduce(pattern, (acc, positionedNote, noteIndex, all) => {
		for (const resultNote of callback(positionedNote, noteIndex, all)) {
			acc.push(resultNote);
		}
		return acc;
	});
}

export function thin(pattern: Pattern, factor: number, seed?: number): ReducePattern {
	const rng = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);
	return reduce(pattern, (acc, positionedNote) => {
		if (rng() > factor) {
			acc.push(positionedNote);
		}
		return acc;
	});
}

export function mask(pattern: Pattern, maskPattern: Pattern): ReducePattern {
	const maskTicks = new Set(maskPattern.notes.map((positionedNote) => positionedNote.tick));
	const maskDuration = maskPattern.durationTicks;
	return reduce(pattern, (acc, positionedNote) => {
		const cyclicTick = maskDuration > 0 ? positionedNote.tick % maskDuration : positionedNote.tick;
		if (maskTicks.has(cyclicTick)) {
			acc.push(positionedNote);
		}
		return acc;
	});
}
