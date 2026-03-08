import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

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
			previousProperties: this.properties,
		});
	}
}

export function offset(pattern: Pattern | Note, amount: number): OffsetPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		startBeat: note.startBeat + amount,
		endBeat: note.endBeat + amount,
	}));

	return new OffsetPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		amount,
		input: resolved,
	});
}
