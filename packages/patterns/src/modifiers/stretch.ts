import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
export interface StretchProperties extends ModifierProperties {
	readonly factor: number;
}

export class StretchPattern extends ModifierPattern<StretchProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "stretch";

	clone(overrides: Partial<PatternProperties>): StretchPattern {
		return new StretchPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function stretch(pattern: Pattern | Note, factor: number): StretchPattern {
	const resolved = toPattern(pattern);
	const cloned = resolved.clone({});

	modifyNotes(cloned, (note) => ({
		...note,
		startBeat: note.startBeat * factor,
		endBeat: note.endBeat * factor,
		slides: note.slides?.map((sl) => ({ ...sl, beat: sl.beat * factor })),
	}));

	return new StretchPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		factor,
		input: resolved,
	});
}
