import type { Event } from "../events";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";

export class SkipPattern extends ModifierPattern {
	static is(value: unknown): value is SkipPattern {
		return value instanceof SkipPattern;
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
			previousProperties: this.properties,
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
