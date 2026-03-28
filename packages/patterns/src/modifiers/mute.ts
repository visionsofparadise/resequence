import type { Event } from "../events";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";

export class MutePattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "mute"] as const;

	static override is(value: unknown): value is MutePattern {
		return ModifierPattern.is(value) && value.type[3] === "mute";
	}

	override setup(): Array<Event> {
		return [];
	}

	override schedule(): Array<Event> {
		return [];
	}

	clone(overrides: Partial<PatternProperties>): MutePattern {
		return new MutePattern({
			...this.properties,
			...overrides,
		});
	}
}

export function mute(pattern: Pattern): MutePattern {
	return new MutePattern({
		notes: [],
		children: [],
		startBeat: pattern.startBeat,
		endBeat: pattern.endBeat,
		input: pattern,
	});
}
