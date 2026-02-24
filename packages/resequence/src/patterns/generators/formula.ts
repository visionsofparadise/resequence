import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export type FormulaCallback = (accumulator: Array<PositionedNote>, index: number, total: number) => Array<PositionedNote>;

export class FormulaPattern extends MidiPattern {
	readonly type = "formula" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly callback: FormulaCallback,
		readonly count: number,
		readonly stepDuration: number,
	) {
		super();
		this.durationTicks = count * stepDuration;

		let acc: Array<PositionedNote> = [];
		for (let stepIndex = 0; stepIndex < count; stepIndex++) {
			acc = callback(acc, stepIndex, count);
		}
		this.notes = acc;
	}

	validate(_context: ValidateContext): void {
		return;
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		prepareNotes(this.notes, offsetTicks, this.outputs, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		scheduleNotes(this.notes, offsetTicks, this.outputs, context);
	}
}

export function formula(callback: FormulaCallback, count: number, stepDuration: Duration | number): FormulaPattern {
	return new FormulaPattern(callback, count, resolveDuration(stepDuration));
}
