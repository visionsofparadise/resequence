import type { Event } from "../events";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";

export class SkipPattern extends ModifierPattern {
	readonly packageName = "@resequence/patterns-core";
	readonly unitName = "skip";

	override setup(): Array<Event> {
		return [];
	}

	override schedule(): Array<Event> {
		return [];
	}

	clone(_overrides: Partial<PatternProperties>): SkipPattern {
		return new SkipPattern({ input: this.properties.input, startBeat: 0, endBeat: 0 });
	}
}

export function skip(pattern: Pattern): SkipPattern {
	return new SkipPattern({ input: pattern, startBeat: 0, endBeat: 0 });
}
