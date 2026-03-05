import type { Note } from "../note";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { flatMapNotes } from "../utils/map";

export interface FlamProperties extends ModifierProperties {
	readonly flamOffset: number;
	readonly graceVelocity: number;
}

export class FlamPattern extends ModifierPattern<FlamProperties> {
	static is(value: unknown): value is FlamPattern {
		return value instanceof FlamPattern;
	}

	clone(overrides: Partial<PatternProperties>): FlamPattern {
		return new FlamPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function flam(pattern: Pattern | Note, flamOffset: number, graceVelocity = 40): FlamPattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note) => [
		{
			...note,
			startBeat: note.startBeat - flamOffset,
			endBeat: note.startBeat,
			velocity: graceVelocity,
			slides: undefined,
		},
		note,
	]);

	return new FlamPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		flamOffset,
		graceVelocity,
		input: resolved,
	});
}
