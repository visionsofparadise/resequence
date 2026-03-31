import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, modifyNotes, walkNotes } from "@resequence/patterns-core";
export interface LegatoProperties extends ModifierProperties {
	readonly extendLast: boolean;
}

export class LegatoPattern extends ModifierPattern<LegatoProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "legato";

	override _setup(): Array<Event> {
		const entries: Array<{ id: string; absoluteStart: number }> = [];

		walkNotes(this, (note, { id, absoluteOffset }) => {
			entries.push({ id, absoluteStart: absoluteOffset + note.startBeat });
		});
		entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);
		const totalDuration = this.endBeat - this.startBeat;

		const endBeatMap = new Map<string, number>();

		for (let noteIndex = 0; noteIndex < entries.length; noteIndex++) {
			const entry = entries[noteIndex];

			if (!entry) continue;
			const nextEntry = entries[noteIndex + 1];

			if (nextEntry) {
				endBeatMap.set(entry.id, nextEntry.absoluteStart);
			} else if (this.properties.extendLast) {
				endBeatMap.set(entry.id, totalDuration);
			}
		}

		modifyNotes(this, (note, { id, absoluteOffset }) => {
			const newAbsEnd = endBeatMap.get(id);

			if (newAbsEnd !== undefined) {
				return { ...note, endBeat: newAbsEnd - absoluteOffset };
			}

			return note;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): LegatoPattern {
		return new LegatoPattern({ extendLast: this.properties.extendLast, input: this.properties.input });
	}
}

export function legato(pattern: Pattern | Note, extendLast = true): LegatoPattern {
	const resolved = toPattern(pattern);

	return new LegatoPattern({ extendLast, input: resolved });
}
