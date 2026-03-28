import type { Event } from "../events";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";

export class SkipPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "skip"] as const;

	static override is(value: unknown): value is SkipPattern {
		return ModifierPattern.is(value) && value.type[3] === "skip";
	}

	override setup(): Array<Event> {
		return [];
	}

	override schedule(): Array<Event> {
		return [];
	}

	clone(overrides: Partial<PatternProperties>): SkipPattern {
		return new SkipPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function skip(pattern: Pattern): SkipPattern {
	return new SkipPattern({
		notes: [],
		children: [],
		startBeat: 0,
		endBeat: 0,
		input: pattern,
	});
}
