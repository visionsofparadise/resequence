import type { Note } from "../note";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

export class ReversePattern extends ModifierPattern {
	static is(value: unknown): value is ReversePattern {
		return value instanceof ReversePattern;
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
