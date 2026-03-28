import type { Note, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
export class ReversePattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "reverse"] as const;

	static override is(value: unknown): value is ReversePattern {
		return ModifierPattern.is(value) && value.type[3] === "reverse";
	}

	clone(overrides: Partial<PatternProperties>): ReversePattern {
		return new ReversePattern({
			...this.properties,
			...overrides,
		});
	}
}

export function reverse(pattern: Pattern | Note): ReversePattern {
	const resolved = toPattern(pattern);
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const cloned = resolved.clone({});

	modifyNotes(cloned, (note, { absoluteOffset }) => {
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
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		input: resolved,
	});
}
