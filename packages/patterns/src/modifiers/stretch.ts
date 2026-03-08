import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

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
