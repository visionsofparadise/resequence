import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { addSteps, NUM_OCTAVES } from "../pitch";
import { modifyNotes } from "../utils/modify";

export interface TransposeProperties extends ModifierProperties {
	readonly interval: number;
}

export class TransposePattern extends ModifierPattern<TransposeProperties> {
	readonly type = ["pattern", "midi", "modifier", "transpose"] as const;

	static override is(value: unknown): value is TransposePattern {
		return ModifierPattern.is(value) && value.type[3] === "transpose";
	}

	clone(overrides: Partial<PatternProperties>): TransposePattern {
		return new TransposePattern({
			...this.properties,
			...overrides,
		});
	}
}

export function transpose(pattern: Pattern | Note, interval: number): TransposePattern {
	const resolved = toPattern(pattern);

	const cloned = resolved.clone({});

	modifyNotes(cloned, (note) => ({
		...note,
		pitch: addSteps(note.pitch, interval),
		slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + interval / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
	}));

	return new TransposePattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		interval,
		input: resolved,
	});
}
