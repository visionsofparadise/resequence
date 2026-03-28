import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { modifyNotes } from "../utils/modify";

export interface OffsetProperties extends ModifierProperties {
	readonly amount: number;
}

export class OffsetPattern extends ModifierPattern<OffsetProperties> {
	readonly type = ["pattern", "midi", "modifier", "offset"] as const;

	static override is(value: unknown): value is OffsetPattern {
		return ModifierPattern.is(value) && value.type[3] === "offset";
	}

	clone(overrides: Partial<PatternProperties>): OffsetPattern {
		return new OffsetPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function offset(pattern: Pattern | Note, amount: number): OffsetPattern {
	const resolved = toPattern(pattern);
	const cloned = resolved.clone({});

	modifyNotes(cloned, (note) => ({
		...note,
		startBeat: note.startBeat + amount,
		endBeat: note.endBeat + amount,
	}));

	return new OffsetPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		amount,
		input: resolved,
	});
}
