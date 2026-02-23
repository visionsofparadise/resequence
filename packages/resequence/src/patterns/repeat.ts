import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class RepeatPattern extends MidiPattern {
	readonly type = "repeat" as const;
	readonly durationTicks: number;

	constructor(
		readonly node: Pattern,
		readonly count: number,
	) {
		super();

		if (count < 1 || !Number.isInteger(count)) {
			throw new ResequenceError('INVALID_REPEAT_COUNT', `repeat(): count must be a positive integer, got ${count}`);
		}

		this.durationTicks = node.durationTicks * count;
	}

	transpose(interval: number): RepeatPattern {
		return new RepeatPattern(this.node.transpose(interval), this.count);
	}

	reverse(): RepeatPattern {
		return new RepeatPattern(this.node.reverse(), this.count);
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		const results: Array<PositionedNote> = [];

		for (let iteration = 0; iteration < this.count; iteration++) {
			results.push(...this.node.getMidi(offset + this.node.durationTicks * iteration, trackName));
		}

		return results;
	}

	validate(context: ValidateContext): void {
		this.node.validate(context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		for (let iteration = 0; iteration < this.count; iteration++) {
			const iterationOffset = offsetTicks + this.node.durationTicks * iteration;

			if (iterationOffset + this.node.durationTicks > context.fromTicks && iterationOffset < context.toTicks) {
				this.node.schedule(iterationOffset, context);
			}
		}
	}
}

export function repeat(node: Pattern, count: number): RepeatPattern {
	return new RepeatPattern(node, count);
}
