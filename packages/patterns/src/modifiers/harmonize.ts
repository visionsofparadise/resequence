import type { Note } from "../note";
import { addSteps, NUM_OCTAVES } from "../pitch";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { flatMapNotes } from "../utils/map";

export interface HarmonizeProperties extends ModifierProperties {
	readonly interval: number;
}

export class HarmonizePattern extends ModifierPattern<HarmonizeProperties> {
	static is(value: unknown): value is HarmonizePattern {
		return value instanceof HarmonizePattern;
	}

	clone(overrides: Partial<PatternProperties>): HarmonizePattern {
		return new HarmonizePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function harmonize(pattern: Pattern | Note, interval: number): HarmonizePattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note) => [
		note,
		{
			...note,
			pitch: addSteps(note.pitch, interval),
			slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + interval / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
		},
	]);

	return new HarmonizePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		interval,
		input: resolved,
	});
}
