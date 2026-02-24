import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

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

export class JitterPattern extends MidiPattern {
	readonly type = "jitter" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly amount: number,
		readonly seed?: number,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const rng = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);

		this.notes = child.notes.map((positionedNote) => ({
			...positionedNote,
			tick: Math.max(0, Math.round(positionedNote.tick + (rng() * 2 - 1) * amount)),
		}));
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

export function jitter(pattern: Pattern, amount: Duration | number, seed?: number): JitterPattern {
	return new JitterPattern(pattern, resolveDuration(amount), seed);
}
