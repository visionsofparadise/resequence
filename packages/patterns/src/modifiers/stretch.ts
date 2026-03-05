import type { Note } from "../note";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

export interface StretchProperties extends ModifierProperties {
	readonly factor: number;
}

export class StretchPattern extends ModifierPattern<StretchProperties> {
	static is(value: unknown): value is StretchPattern {
		return value instanceof StretchPattern;
	}

	clone(overrides: Partial<PatternProperties>): StretchPattern {
		return new StretchPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function stretch(pattern: Pattern | Note, factor: number): StretchPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		startBeat: note.startBeat * factor,
		endBeat: note.endBeat * factor,
		slides: note.slides?.map((sl) => ({ ...sl, beat: sl.beat * factor })),
	}));

	return new StretchPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		factor,
		input: resolved,
	});
}
