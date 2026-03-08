import type { Note } from "../note";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

export class ReversePattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "reverse"] as const;

	static override is(value: unknown): value is ReversePattern {
		return ModifierPattern.is(value) && value.type[3] === "reverse";
	}

	clone(overrides: Partial<PatternProperties>): ReversePattern {
		return new ReversePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function reverse(pattern: Pattern | Note): ReversePattern {
	const resolved = toPattern(pattern);
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const transformed = mapNotes(resolved, (note, { absoluteOffset }) => {
		const noteDuration = note.endBeat - note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const newAbsStart = totalDuration - absEnd;
		const newStartBeat = newAbsStart - absoluteOffset;

		return {
			...note,
			startBeat: newStartBeat,
			endBeat: newStartBeat + noteDuration,
		};
	});

	return new ReversePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		input: resolved,
	});
}
