import type { Duration } from "../duration";
import { resolveDuration } from "../duration";
import type { Pattern } from "./pattern";
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
}

export function layer(...nodes: ReadonlyArray<Pattern>): LayerPattern {
	return new LayerPattern(nodes);
}
