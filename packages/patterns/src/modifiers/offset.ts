import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
export interface OffsetProperties extends ModifierProperties {
	readonly amount: number;
}

export class OffsetPattern extends ModifierPattern<OffsetProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "offset";

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
