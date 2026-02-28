import { pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes, flatMapNotes } from "../utils/tree";

export class PolyphonyPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly max: number,
		readonly isGreedy: boolean,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): PolyphonyPattern {
		return new PolyphonyPattern(this.source, this.max, this.isGreedy, this.overrideNode(overrides));
	}
}

export function polyphony(pattern: Pattern | ScoreNote, max: number, isGreedy = false): PolyphonyPattern {
	const resolved = toPattern(pattern);
	const allNotes = collectNotes(resolved);
	const sorted = allNotes.slice().sort((noteA, noteB) => noteA.startBeat - noteB.startBeat);

	const kept = new Set<string>();
	const active: Array<ScoreNote> = [];

	for (const scoreNote of sorted) {
		const stillActive = active.filter((keptNote) => keptNote.startBeat <= scoreNote.startBeat && scoreNote.startBeat < keptNote.endBeat);

		if (stillActive.length < max) {
			const key = `${scoreNote.startBeat}:${scoreNote.endBeat}:${pitchKey(scoreNote.pitch)}`;
			kept.add(key);
			active.push(scoreNote);
		} else if (isGreedy) {
			let oldest = stillActive[0];
			if (!oldest) continue;

			for (const activeNote of stillActive) {
				if (activeNote.startBeat < oldest.startBeat) oldest = activeNote;
			}

			const oldestKey = `${oldest.startBeat}:${oldest.endBeat}:${pitchKey(oldest.pitch)}`;
			kept.delete(oldestKey);
			const oldestIndex = active.indexOf(oldest);
			if (oldestIndex >= 0) active.splice(oldestIndex, 1);

			const key = `${scoreNote.startBeat}:${scoreNote.endBeat}:${pitchKey(scoreNote.pitch)}`;
			kept.add(key);
			active.push(scoreNote);
		}
	}

	const transformed = flatMapNotes(resolved, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const key = `${absStart}:${absEnd}:${pitchKey(note.pitch)}`;

		if (kept.has(key)) return [note];
		return [];
	});

	return new PolyphonyPattern(pattern, max, isGreedy, transformed);
}
