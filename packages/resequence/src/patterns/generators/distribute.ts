import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

function euclidean(hits: number, steps: number, rotate: number): ReadonlyArray<boolean> {
	if (steps === 0) return [];
	const pattern: Array<boolean> = [];
	for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
		pattern.push((stepIndex * hits) % steps < hits);
	}
	const rotateAmount = ((rotate % steps) + steps) % steps;
	return [...pattern.slice(rotateAmount), ...pattern.slice(0, rotateAmount)];
}

export class DistributePattern extends MidiPattern {
	readonly type = "distribute" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly hits: number,
		readonly steps: number,
		readonly pitch: number,
		readonly stepDuration: number,
		readonly rotate = 0,
	) {
		super();

		this.durationTicks = steps * stepDuration;

		const pattern = euclidean(hits, steps, rotate);
		const result: Array<PositionedNote> = [];

		for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
			if (pattern[stepIndex]) {
				result.push({
					tick: stepIndex * stepDuration,
					pitch,
					durationTicks: stepDuration,
				});
			}
		}

		this.notes = result;
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

export function distribute(hits: number, steps: number, pitch: number, stepDuration: Duration | number, rotate = 0): DistributePattern {
	return new DistributePattern(hits, steps, pitch, resolveDuration(stepDuration), rotate);
}
