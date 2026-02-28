import { addSteps, pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes, mapNotes } from "../utils/tree";

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
	const allNotes = collectNotes(resolved);

	const byBeat = new Map<number, Array<ScoreNote>>();
	for (const scoreNote of allNotes) {
		let group = byBeat.get(scoreNote.startBeat);
		if (!group) {
			group = [];
			byBeat.set(scoreNote.startBeat, group);
		}
		group.push(scoreNote);
	}

	const shiftMap = new Map<string, number>();

	for (const group of byBeat.values()) {
		const sorted = group.slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch));

		if (inversions > 0) {
			for (const [noteIndex, scoreNote] of sorted.entries()) {
				if (noteIndex < inversions) {
					const key = `${scoreNote.startBeat}:${scoreNote.endBeat}:${pitchKey(scoreNote.pitch)}`;
					shiftMap.set(key, scoreNote.pitch.stepsPerOctave);
				}
			}
		} else if (inversions < 0) {
			const count = -inversions;
			for (const [noteIndex, scoreNote] of sorted.entries()) {
				if (noteIndex >= sorted.length - count) {
					const key = `${scoreNote.startBeat}:${scoreNote.endBeat}:${pitchKey(scoreNote.pitch)}`;
					shiftMap.set(key, -scoreNote.pitch.stepsPerOctave);
				}
			}
		}
	}

	const transformed = mapNotes(resolved, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const key = `${absStart}:${absEnd}:${pitchKey(note.pitch)}`;
		const shift = shiftMap.get(key);

		if (shift) {
			return {
				...note,
				pitch: addSteps(note.pitch, shift),
				slides: note.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, shift) })),
			};
		}

		return note;
	});

	return new InvertPattern(pattern, inversions, transformed);
}
