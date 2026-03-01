import { NUM_OCTAVES, pitchKey } from "../../utils/pitch";
import type { Pitch } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes, walkNotes } from "../utils/tree";

export type SortKey = "asc" | "desc" | ((noteA: ScoreNote, noteB: ScoreNote) => number);

export class SortPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly key: SortKey,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): SortPattern {
		return new SortPattern(this.source, this.key, this.overrideNode(overrides));
	}
}

export function sort(pattern: Pattern | ScoreNote, key: SortKey = "asc"): SortPattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number; pitch: Pitch; absoluteNote: ScoreNote }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, pitch: note.pitch, absoluteNote: { ...note, startBeat: absoluteOffset + note.startBeat, endBeat: absoluteOffset + note.endBeat } });
	});
	const byTick = entries.slice().sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);

	let pitches: Array<Pitch>;

	if (typeof key === "function") {
		pitches = entries.slice().sort((ea, eb) => key(ea.absoluteNote, eb.absoluteNote)).map((entry) => entry.pitch);
	} else if (key === "desc") {
		pitches = byTick.map((entry) => entry.pitch).sort((pitchA, pitchB) => pitchKey(pitchB) - pitchKey(pitchA));
	} else {
		pitches = byTick.map((entry) => entry.pitch).sort((pitchA, pitchB) => pitchKey(pitchA) - pitchKey(pitchB));
	}

	const pitchAssignment = new Map<string, Pitch>();

	for (const [noteIndex, entry] of byTick.entries()) {
		const newPitch = pitches[noteIndex] ?? entry.pitch;
		if (pitchKey(newPitch) !== pitchKey(entry.pitch)) {
			pitchAssignment.set(entry.id, newPitch);
		}
	}

	const transformed = mapNotes(resolved, (note, { id }) => {
		const newPitch = pitchAssignment.get(id);

		if (newPitch) {
			const shift = pitchKey(newPitch) - pitchKey(note.pitch);
			return {
				...note,
				pitch: newPitch,
				slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + shift / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
			};
		}

		return note;
	});

	return new SortPattern(pattern, key, transformed);
}
