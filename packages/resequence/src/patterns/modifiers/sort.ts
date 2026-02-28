import { addSteps, pitchKey } from "../../utils/pitch";
import type { Pitch } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { collectNotes, mapNotes } from "../utils/tree";

export type SortKey = "asc" | "desc" | ((noteA: ScoreNote, noteB: ScoreNote) => number);

export class SortPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly key: SortKey,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): SortPattern {
		return new SortPattern(this.source, this.key, this.overrideNode(overrides));
	}
}

export function sort(pattern: Pattern, key: SortKey = "asc"): SortPattern {
	const allNotes = collectNotes(pattern);
	const byTick = allNotes.slice().sort((noteA, noteB) => noteA.startBeat - noteB.startBeat);

	let pitches: Array<Pitch>;

	if (typeof key === "function") {
		pitches = allNotes.slice().sort(key).map((scoreNote) => scoreNote.pitch);
	} else if (key === "desc") {
		pitches = byTick.map((scoreNote) => scoreNote.pitch).sort((pitchA, pitchB) => pitchKey(pitchB) - pitchKey(pitchA));
	} else {
		pitches = byTick.map((scoreNote) => scoreNote.pitch).sort((pitchA, pitchB) => pitchKey(pitchA) - pitchKey(pitchB));
	}

	const pitchAssignment = new Map<string, Pitch>();

	for (const [noteIndex, scoreNote] of byTick.entries()) {
		const newPitch = pitches[noteIndex] ?? scoreNote.pitch;
		if (pitchKey(newPitch) !== pitchKey(scoreNote.pitch)) {
			const noteKey = `${scoreNote.startBeat}:${scoreNote.endBeat}:${pitchKey(scoreNote.pitch)}`;
			pitchAssignment.set(noteKey, newPitch);
		}
	}

	const transformed = mapNotes(pattern, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const noteKey = `${absStart}:${absEnd}:${pitchKey(note.pitch)}`;
		const newPitch = pitchAssignment.get(noteKey);

		if (newPitch) {
			const shift = pitchKey(newPitch) - pitchKey(note.pitch);
			return {
				...note,
				pitch: newPitch,
				slides: note.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, shift) })),
			};
		}

		return note;
	});

	return new SortPattern(pattern, key, transformed);
}
