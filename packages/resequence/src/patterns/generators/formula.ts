import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export type GenerativeCallback = (accumulator: Array<ScoreNote>, index: number, total: number) => Array<ScoreNote>;

export class GenerativePattern extends MidiPattern {
	readonly type = "generative" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;

	constructor(
		readonly callback: GenerativeCallback,
		readonly count: number,
		readonly stepDuration: number,
	) {
		super();
		this.durationBeats = count * stepDuration;

		let acc: Array<ScoreNote> = [];
		for (let stepIndex = 0; stepIndex < count; stepIndex++) {
			acc = callback(acc, stepIndex, count);
		}
		this.notes = acc;
	}

	validate(_context: ValidateContext): void {
		return;
	}


	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
	}
}

export function generative(callback: GenerativeCallback, count: number, stepDuration: Duration | number): GenerativePattern {
	return new GenerativePattern(callback, count, resolveDuration(stepDuration));
}
