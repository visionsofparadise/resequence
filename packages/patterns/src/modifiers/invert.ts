import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { addSteps, NUM_OCTAVES, pitchKey } from "../pitch";
import { mapNotes } from "../utils/map";
import { walkNotes } from "../utils/walk";

export interface InvertProperties extends ModifierProperties {
	readonly inversions: number;
}

export class InvertPattern extends ModifierPattern<InvertProperties> {
	static is(value: unknown): value is InvertPattern {
		return value instanceof InvertPattern;
	}

	clone(overrides: Partial<PatternProperties>): InvertPattern {
		return new InvertPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function invertChord(pattern: Pattern | Note, inversions: number): InvertPattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number; key: number; stepsPerOctave: number }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, key: pitchKey(note.pitch), stepsPerOctave: note.pitch.stepsPerOctave });
	});

	const byBeat = new Map<number, typeof entries>();
	for (const entry of entries) {
		let group = byBeat.get(entry.absoluteStart);
		if (!group) {
			group = [];
			byBeat.set(entry.absoluteStart, group);
		}
		group.push(entry);
	}

	const shiftMap = new Map<string, number>();

	for (const group of byBeat.values()) {
		const sorted = group.slice().sort((ea, eb) => ea.key - eb.key);

		if (inversions > 0) {
			for (const [noteIndex, entry] of sorted.entries()) {
				if (noteIndex < inversions) {
					shiftMap.set(entry.id, entry.stepsPerOctave);
				}
			}
		} else if (inversions < 0) {
			const count = -inversions;
			for (const [noteIndex, entry] of sorted.entries()) {
				if (noteIndex >= sorted.length - count) {
					shiftMap.set(entry.id, -entry.stepsPerOctave);
				}
			}
		}
	}

	const transformed = mapNotes(resolved, (note, { id }) => {
		const shift = shiftMap.get(id);

		if (shift) {
			return {
				...note,
				pitch: addSteps(note.pitch, shift),
				slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + shift / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
			};
		}

		return note;
	});

	return new InvertPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		inversions,
		input: resolved,
	});
}
