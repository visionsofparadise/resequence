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
			throw new ResequenceError("INVALID_REPEAT_COUNT", `repeat(): count must be a positive integer, got ${count}`);
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
		const resolvedTrackName = this.resolveTrackName(trackName);

		for (let iteration = 0; iteration < this.count; iteration++) {
			results.push(...this.node.getMidi(offset + this.node.durationTicks * iteration, resolvedTrackName));
		}

		return results;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;
		this.node.validate(childContext);
	}

	setup(context: ScheduleContext): void {
		this.node.setup(context);
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;
		const childContext = this.outputs.length > 0 ? { ...context, activeNodes: this.outputs } : context;

		for (let iteration = 0; iteration < this.count; iteration++) {
			const iterationOffset = offsetTicks + this.node.durationTicks * iteration;

			if (iterationOffset + this.node.durationTicks > context.fromTicks && iterationOffset < context.toTicks) {
				this.node.prepare(iterationOffset, childContext);
			}
		}
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;
		const childContext = this.outputs.length > 0 ? { ...context, activeNodes: this.outputs } : context;

		for (let iteration = 0; iteration < this.count; iteration++) {
			const iterationOffset = offsetTicks + this.node.durationTicks * iteration;

			if (iterationOffset + this.node.durationTicks > context.fromTicks && iterationOffset < context.toTicks) {
				this.node.schedule(iterationOffset, childContext);
			}
		}
	}

	teardown(context: ScheduleContext): void {
		this.node.teardown(context);
	}
}

export function repeat(node: Pattern, count: number): RepeatPattern {
	return new RepeatPattern(node, count);
}
