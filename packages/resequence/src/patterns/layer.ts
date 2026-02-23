import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { Pattern, PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class LayerPattern extends MidiPattern {
	readonly type = "layer" as const;
	readonly durationTicks: number;

	constructor(
		readonly nodes: ReadonlyArray<Pattern>,
		readonly duration?: Duration,
	) {
		super();

		this.durationTicks = duration !== undefined ? resolveDuration(duration) : Math.max(0, ...nodes.map((node) => node.durationTicks));
	}

	transpose(interval: number): LayerPattern {
		return new LayerPattern(
			this.nodes.map((child) => child.transpose(interval)),
			this.duration,
		);
	}

	reverse(): LayerPattern {
		return new LayerPattern(
			this.nodes.map((child) => child.reverse()),
			this.duration,
		);
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		const results: Array<PositionedNote> = [];

		for (const child of this.nodes) {
			results.push(...child.getMidi(offset, trackName));
		}

		return results;
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		for (const child of this.nodes) {
			child.schedule(offsetTicks, context);
		}
	}
}

export function layer(...nodes: ReadonlyArray<Pattern>): LayerPattern {
	return new LayerPattern(nodes);
}
