import { ModifierPattern, toPattern, addSteps, pitchKey, modifyNotes, walkNotes } from "@resequence/patterns-core";
import { groupByBeat } from "../utils/groupByBeat";
import { repitchNote } from "../utils/repitchNote";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface InvertProperties extends ModifierProperties {
	readonly inversions: number;
}

export class InvertPattern extends ModifierPattern<InvertProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "invert";

	override _setup(): Array<Event> {
		const entries: Array<{ id: string; absoluteStart: number; key: number; stepsPerOctave: number }> = [];

		walkNotes(this, (note, { id, absoluteOffset }) => {
			entries.push({
				id,
				absoluteStart: absoluteOffset + note.startBeat,
				key: pitchKey(note.pitch),
				stepsPerOctave: note.pitch.stepsPerOctave,
			});
		});

		const byBeat = groupByBeat(entries);

		const shiftMap = new Map<string, number>();

		for (const group of byBeat.values()) {
			const sorted = group.slice().sort((ea, eb) => ea.key - eb.key);

			if (this.properties.inversions > 0) {
				for (const [noteIndex, entry] of sorted.entries()) {
					if (noteIndex < this.properties.inversions) {
						shiftMap.set(entry.id, entry.stepsPerOctave);
					}
				}
			} else if (this.properties.inversions < 0) {
				const count = -this.properties.inversions;

				for (const [noteIndex, entry] of sorted.entries()) {
					if (noteIndex >= sorted.length - count) {
						shiftMap.set(entry.id, -entry.stepsPerOctave);
					}
				}
			}
		}

		modifyNotes(this, (note, { id }) => {
			const shift = shiftMap.get(id);

			return shift ? repitchNote(note, addSteps(note.pitch, shift)) : note;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): InvertPattern {
		return new InvertPattern({ inversions: this.properties.inversions, input: this.properties.input });
	}
}

export function invert(pattern: Pattern | Note, inversions: number): InvertPattern {
	const resolved = toPattern(pattern);

	return new InvertPattern({ inversions, input: resolved });
}
