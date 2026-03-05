import type { Event } from "../events";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";

export class MutePattern extends ModifierPattern {
	static is(value: unknown): value is MutePattern {
		return value instanceof MutePattern;
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
			previousProperties: this.properties,
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
