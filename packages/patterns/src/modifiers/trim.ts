import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
export interface TrimProperties extends ModifierProperties {
	readonly fromBeats: number;
	readonly toBeats: number;
}

export class TrimPattern extends ModifierPattern<TrimProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "trim";

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
