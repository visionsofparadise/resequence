import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { flatMapNotes } from "../utils/map";

export interface TrimProperties extends ModifierProperties {
	readonly fromBeats: number;
	readonly toBeats: number;
}

export class TrimPattern extends ModifierPattern<TrimProperties> {
	static is(value: unknown): value is TrimPattern {
		return value instanceof TrimPattern;
	}

	clone(overrides: Partial<PatternProperties>): TrimPattern {
		return new TrimPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function trim(pattern: Pattern | Note, fromBeats: number, toBeats: number): TrimPattern {
	const resolved = toPattern(pattern);

	const transformed = flatMapNotes(resolved, (note, { absoluteOffset }) => {
		const noteStart = absoluteOffset + note.startBeat;
		const noteEnd = absoluteOffset + note.endBeat;
		const overlapStart = Math.max(noteStart, fromBeats);
		const overlapEnd = Math.min(noteEnd, toBeats);

		if (overlapEnd > overlapStart) {
			return [
				{
					...note,
					startBeat: overlapStart - absoluteOffset - fromBeats,
					endBeat: overlapEnd - absoluteOffset - fromBeats,
				},
			];
		}

		return [];
	});

	const trimDuration = Math.max(0, toBeats - fromBeats);

	return new TrimPattern({ notes: transformed.notes, children: transformed.children, startBeat: 0, endBeat: trimDuration, fromBeats, toBeats, input: resolved });
}
