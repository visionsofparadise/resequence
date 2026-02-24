import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class SequencePattern extends MidiPattern {
	readonly type = "sequence" as const;
	readonly durationTicks: number;

	constructor(readonly children: ReadonlyArray<Pattern>) {
		super();
		this.durationTicks = children.reduce((sum, child) => sum + child.durationTicks, 0);
	}

	transpose(interval: number): SequencePattern {
		return new SequencePattern(this.children.map((child) => child.transpose(interval)));
	}

	reverse(): SequencePattern {
		return new SequencePattern([...this.children].reverse().map((child) => child.reverse()));
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		const results: Array<PositionedNote> = [];
		const resolvedTrackName = this.resolveTrackName(trackName);
		let cursor = offset;

		for (const child of this.children) {
			results.push(...child.getMidi(cursor, resolvedTrackName));
			cursor += child.durationTicks;
		}

		return results;
	}

	validate(context: ValidateContext): void {
		if (this.children.length === 0) {
			context.warnings.push({ code: "EMPTY_CONTAINER", message: "sequence() has no children" });
		}
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;
		for (const child of this.children) {
			child.validate(childContext);
		}
	}

	setup(context: ScheduleContext): void {
		for (const child of this.children) {
			child.setup(context);
		}
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;
		const childContext = this.outputs.length > 0 ? { ...context, activeNodes: this.outputs } : context;
		let cursor = offsetTicks;

		for (const child of this.children) {
			if (cursor + child.durationTicks > context.fromTicks && cursor < context.toTicks) {
				child.prepare(cursor, childContext);
			}
			cursor += child.durationTicks;
		}
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;
		const childContext = this.outputs.length > 0 ? { ...context, activeNodes: this.outputs } : context;
		let cursor = offsetTicks;

		for (const child of this.children) {
			if (cursor + child.durationTicks > context.fromTicks && cursor < context.toTicks) {
				child.schedule(cursor, childContext);
			}
			cursor += child.durationTicks;
		}
	}

	teardown(context: ScheduleContext): void {
		for (const child of this.children) {
			child.teardown(context);
		}
	}
}

export function sequence(...nodes: ReadonlyArray<Pattern>): SequencePattern {
	return new SequencePattern(nodes);
}
