import { addSteps, NUM_OCTAVES, pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes, walkNotes } from "../utils/tree";

export class InvertPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly inversions: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): InvertPattern {
		return new InvertPattern(this.source, this.inversions, this.overrideNode(overrides));
	}
}

export function invertChord(pattern: Pattern | ScoreNote, inversions: number): InvertPattern {
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

	return new InvertPattern(pattern, inversions, transformed);
}
