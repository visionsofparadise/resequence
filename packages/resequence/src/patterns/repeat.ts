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

		this.durationTicks = node.durationTicks * count;
	}

	transpose(interval: number): RepeatPattern {
		return new RepeatPattern(this.node.transpose(interval), this.count);
	}

	reverse(): RepeatPattern {
		return new RepeatPattern(this.node.reverse(), this.count);
	}

	getNotes(offset = 0): Array<PositionedNote> {
		const results: Array<PositionedNote> = [];

		for (let iteration = 0; iteration < this.count; iteration++) {
			results.push(...this.node.getNotes(offset + this.node.durationTicks * iteration));
		}

		return results;
	}
}

export function repeat(node: Pattern, count: number): RepeatPattern {
	return new RepeatPattern(node, count);
}
