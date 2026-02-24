import type { ScheduleContext } from "../rendering/schedule-context";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class LayerPattern extends MidiPattern {
	readonly type = "layer" as const;
	readonly durationTicks: number;

	constructor(
		readonly children: ReadonlyArray<Pattern>,
		readonly duration?: Duration,
	) {
		super();

		this.durationTicks = duration !== undefined ? resolveDuration(duration) : Math.max(0, ...children.map((child) => child.durationTicks));
	}

	transpose(interval: number): LayerPattern {
		return new LayerPattern(
			this.children.map((child) => child.transpose(interval)),
			this.duration,
		);
	}

	reverse(): LayerPattern {
		return new LayerPattern(
			this.children.map((child) => child.reverse()),
			this.duration,
		);
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		const results: Array<PositionedNote> = [];
		const resolvedTrackName = this.resolveTrackName(trackName);

		for (const child of this.children) {
			results.push(...child.getMidi(offset, resolvedTrackName));
		}

		return results;
	}

	validate(context: ValidateContext): void {
		if (this.children.length === 0) {
			context.warnings.push({ code: "EMPTY_CONTAINER", message: "layer() has no children" });
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

		for (const child of this.children) {
			child.prepare(offsetTicks, childContext);
		}
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;
		const childContext = this.outputs.length > 0 ? { ...context, activeNodes: this.outputs } : context;

		for (const child of this.children) {
			child.schedule(offsetTicks, childContext);
		}
	}

	teardown(context: ScheduleContext): void {
		for (const child of this.children) {
			child.teardown(context);
		}
	}
}

export function layer(...nodes: ReadonlyArray<Pattern>): LayerPattern {
	return new LayerPattern(nodes);
}
