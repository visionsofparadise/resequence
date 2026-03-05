import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { addSteps, NUM_OCTAVES } from "../pitch";
import { mapNotes } from "../utils/map";

export interface TransposeProperties extends ModifierProperties {
	readonly interval: number;
}

export class TransposePattern extends ModifierPattern<TransposeProperties> {
	static is(value: unknown): value is TransposePattern {
		return value instanceof TransposePattern;
	}

	clone(overrides: Partial<PatternProperties>): TransposePattern {
		return new TransposePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function transpose(pattern: Pattern | Note, interval: number): TransposePattern {
	const resolved = toPattern(pattern);

	const transformed = mapNotes(resolved, (note) => ({
		...note,
		pitch: addSteps(note.pitch, interval),
		slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + interval / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
	}));

	return new TransposePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		interval,
		input: resolved,
	});
}
