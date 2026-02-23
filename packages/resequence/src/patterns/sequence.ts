import type { Pattern, PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

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

	getNotes(offset = 0): Array<PositionedNote> {
		const results: Array<PositionedNote> = [];

		let cursor = offset;

		for (const child of this.nodes) {
			results.push(...child.getNotes(cursor));
			cursor += child.durationTicks;
		}

		return results;
	}
}

export function sequence(...nodes: ReadonlyArray<Pattern>): SequencePattern {
	return new SequencePattern(nodes);
}
