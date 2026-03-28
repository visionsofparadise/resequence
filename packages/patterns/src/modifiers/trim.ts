import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { flatModifyNotes } from "../utils/modify";

export interface TrimProperties extends ModifierProperties {
	readonly fromBeats: number;
	readonly toBeats: number;
}

export class TrimPattern extends ModifierPattern<TrimProperties> {
	readonly type = ["pattern", "midi", "modifier", "trim"] as const;

	static override is(value: unknown): value is TrimPattern {
		return ModifierPattern.is(value) && value.type[3] === "trim";
	}

	clone(overrides: Partial<PatternProperties>): TrimPattern {
		return new TrimPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function trim(pattern: Pattern | Note, fromBeats: number, toBeats: number): TrimPattern {
	const resolved = toPattern(pattern);

	const cloned = resolved.clone({});

	flatModifyNotes(cloned, (note, { absoluteOffset }) => {
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

	return new TrimPattern({ notes: cloned.notes, children: cloned.children, startBeat: 0, endBeat: trimDuration, fromBeats, toBeats, input: resolved });
}
