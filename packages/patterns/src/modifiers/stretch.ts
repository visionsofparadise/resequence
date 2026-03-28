import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { modifyNotes } from "../utils/modify";

export interface StretchProperties extends ModifierProperties {
	readonly factor: number;
}

export class StretchPattern extends ModifierPattern<StretchProperties> {
	readonly type = ["pattern", "midi", "modifier", "stretch"] as const;

	static override is(value: unknown): value is StretchPattern {
		return ModifierPattern.is(value) && value.type[3] === "stretch";
	}

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
