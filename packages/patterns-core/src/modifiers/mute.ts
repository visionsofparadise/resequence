import { ModifierPattern } from "../patterns/modifier";
import type { Event } from "../events";
import type { Pattern, PatternProperties } from "../patterns/pattern";

export class MutePattern extends ModifierPattern {
	readonly packageName = "@resequence/patterns-core";
	readonly unitName = "mute";

	override setup(): Array<Event> {
		return [];
	}

	override schedule(): Array<Event> {
		return [];
	}

	clone(_overrides: Partial<PatternProperties>): MutePattern {
		return new MutePattern({ input: this.properties.input });
	}
}

export function mute(pattern: Pattern): MutePattern {
	return new MutePattern({ input: pattern });
}
