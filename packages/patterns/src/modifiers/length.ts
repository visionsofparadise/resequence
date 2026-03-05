import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

export interface LengthProperties extends ModifierProperties {
	readonly noteDuration: number;
}

export class LengthPattern extends ModifierPattern<LengthProperties> {
	static is(value: unknown): value is LengthPattern {
		return value instanceof LengthPattern;
	}

	clone(overrides: Partial<PatternProperties>): LengthPattern {
		return new LengthPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function length(pattern: Pattern | Note, duration: number): LengthPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => {
		const truncatedSlides = note.slides?.filter((sl) => sl.beat <= duration);
		return {
			...note,
			endBeat: note.startBeat + duration,
			slides: truncatedSlides && truncatedSlides.length > 0 ? truncatedSlides : undefined,
		};
	});

	return new LengthPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		noteDuration: duration,
		input: resolved,
	});
}
