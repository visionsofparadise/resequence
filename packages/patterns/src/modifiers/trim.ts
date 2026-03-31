import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
export interface TrimProperties extends ModifierProperties {
	readonly fromBeats: number;
	readonly toBeats: number;
}

export class TrimPattern extends ModifierPattern<TrimProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "trim";

	override _setup(): Array<Event> {
		flatModifyNotes(this, (note, { absoluteOffset }) => {
			const noteStart = absoluteOffset + note.startBeat;
			const noteEnd = absoluteOffset + note.endBeat;
			const overlapStart = Math.max(noteStart, this.properties.fromBeats);
			const overlapEnd = Math.min(noteEnd, this.properties.toBeats);

			if (overlapEnd > overlapStart) {
				return [
					{
						...note,
						startBeat: overlapStart - absoluteOffset - this.properties.fromBeats,
						endBeat: overlapEnd - absoluteOffset - this.properties.fromBeats,
					},
				];
			}

			return [];
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): TrimPattern {
		const trimDuration = Math.max(0, this.properties.toBeats - this.properties.fromBeats);

		return new TrimPattern({ fromBeats: this.properties.fromBeats, toBeats: this.properties.toBeats, input: this.properties.input, startBeat: 0, endBeat: trimDuration });
	}
}

export function trim(pattern: Pattern | Note, fromBeats: number, toBeats: number): TrimPattern {
	const resolved = toPattern(pattern);
	const trimDuration = Math.max(0, toBeats - fromBeats);

	return new TrimPattern({ fromBeats, toBeats, input: resolved, startBeat: 0, endBeat: trimDuration });
}
