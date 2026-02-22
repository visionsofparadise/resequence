import { MidiPattern } from "./pattern";
import type { Pattern } from "./pattern";

export class SequencePattern extends MidiPattern {
	readonly type = "sequence" as const;
	readonly durationTicks: number;

	constructor(readonly nodes: ReadonlyArray<Pattern>) {
		super();
		this.durationTicks = nodes.reduce((sum, node) => sum + node.durationTicks, 0);
	}

	transpose(interval: number): SequencePattern {
		return new SequencePattern(this.nodes.map((child) => child.transpose(interval)));
	}

	reverse(): SequencePattern {
		return new SequencePattern([...this.nodes].reverse().map((child) => child.reverse()));
	}
}

export function sequence(...nodes: ReadonlyArray<Pattern>): SequencePattern {
	return new SequencePattern(nodes);
}
