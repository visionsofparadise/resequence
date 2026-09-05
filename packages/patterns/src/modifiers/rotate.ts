import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
import { noteStartEntriesOf } from "../utils/noteStartEntries";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface RotateProperties extends ModifierProperties {
	readonly steps: number;
}

export class RotatePattern extends ModifierPattern<RotateProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "rotate";

	override _setup(): Array<Event> {
		const entries = noteStartEntriesOf(this);

		if (entries.length === 0) return [];

		const totalDuration = this.endBeat - this.startBeat;
		const noteCount = entries.length;
		const firstEntry = entries[0];

		if (!firstEntry) return [];

		const gaps: Array<number> = [];

		for (let gapIndex = 0; gapIndex < noteCount; gapIndex++) {
			const current = entries[gapIndex];

			if (!current) continue;

			if (gapIndex < noteCount - 1) {
				const next = entries[gapIndex + 1];

				if (!next) continue;

				gaps.push(next.absoluteStart - current.absoluteStart);
			} else {
				gaps.push(totalDuration - current.absoluteStart + firstEntry.absoluteStart);
			}
		}

		const shift = ((this.properties.steps % noteCount) + noteCount) % noteCount;
		const rotatedEntries = [...entries.slice(shift), ...entries.slice(0, shift)];
		const rotatedGaps = [...gaps.slice(shift), ...gaps.slice(0, shift)];

		const beatAssignment = new Map<string, number>();
		let beat = 0;

		for (let noteIndex = 0; noteIndex < noteCount; noteIndex++) {
			const rotatedEntry = rotatedEntries[noteIndex];
			const rotatedGap = rotatedGaps[noteIndex];

			if (!rotatedEntry || rotatedGap === undefined) continue;

			beatAssignment.set(rotatedEntry.id, beat);
			beat += rotatedGap;
		}

		modifyNotes(this, (note, { id, absoluteOffset }) => {
			const newAbsBeat = beatAssignment.get(id);

			if (newAbsBeat !== undefined) {
				const noteDuration = note.endBeat - note.startBeat;

				return {
					...note,
					startBeat: newAbsBeat - absoluteOffset,
					endBeat: newAbsBeat - absoluteOffset + noteDuration,
				};
			}

			return note;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): RotatePattern {
		return new RotatePattern({ steps: this.properties.steps, input: this.properties.input });
	}
}

export function rotate(pattern: Pattern | Note, steps: number): RotatePattern {
	const resolved = toPattern(pattern);

	return new RotatePattern({ steps, input: resolved });
}
