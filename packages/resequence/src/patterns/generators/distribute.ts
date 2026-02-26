import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { Pitch } from "../../utils/pitch";
import { resolvePitch } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { ScoreNote } from "../pattern";
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
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;

	constructor(
		readonly hits: number,
		readonly steps: number,
		readonly pitch: Pitch,
		readonly stepDuration: number,
		readonly rotate = 0,
	) {
		super();

		this.durationBeats = steps * stepDuration;

		const pattern = euclidean(hits, steps, rotate);
		const result: Array<ScoreNote> = [];

		for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
			if (pattern[stepIndex]) {
				result.push({
					beat: stepIndex * stepDuration,
					pitch,
					durationBeats: stepDuration,
					outputs: [],
				});
			}
		}

		this.notes = result;
	}

	validate(_context: ValidateContext): void {
		return;
	}


	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
	}
}

export function distribute(hits: number, steps: number, pitch: string | number | Pitch, stepDuration: Duration | number, rotate = 0): DistributePattern {
	return new DistributePattern(hits, steps, resolvePitch(pitch), resolveDuration(stepDuration), rotate);
}
