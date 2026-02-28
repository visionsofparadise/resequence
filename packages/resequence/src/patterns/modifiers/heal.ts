;
;
import { pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes, flatMapNotes } from "../utils/tree";

export class HealPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly threshold: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): HealPattern {
		return new HealPattern(this.source, this.threshold, this.overrideNode(overrides));
	}
}

export function heal(pattern: Pattern | ScoreNote, threshold?: number): HealPattern {
	const resolved = toPattern(pattern);
	const resolvedThreshold = threshold ?? 0;
	const allNotes = collectNotes(resolved);
	const sorted = allNotes.slice().sort((noteA, noteB) => noteA.startBeat - noteB.startBeat || pitchKey(noteA.pitch) - pitchKey(noteB.pitch));

	const merged = new Set<string>();
	const extensions = new Map<string, number>();

	let last: ScoreNote | undefined;

	for (const scoreNote of sorted) {
		if (last !== undefined) {
			const prevEnd = last.endBeat;
			const gap = scoreNote.startBeat - prevEnd;

			if (pitchKey(last.pitch) === pitchKey(scoreNote.pitch) && gap <= resolvedThreshold) {
				const lastKey = `${last.startBeat}:${last.endBeat}:${pitchKey(last.pitch)}`;
				const mergedKey = `${scoreNote.startBeat}:${scoreNote.endBeat}:${pitchKey(scoreNote.pitch)}`;
				const newEndBeat = scoreNote.endBeat;
				extensions.set(lastKey, newEndBeat);
				merged.add(mergedKey);
				last = { ...last, endBeat: newEndBeat };
				continue;
			}
		}

		last = scoreNote;
	}

	const transformed = flatMapNotes(resolved, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const key = `${absStart}:${absEnd}:${pitchKey(note.pitch)}`;

		if (merged.has(key)) return [];

		const newEndBeat = extensions.get(key);
		if (newEndBeat !== undefined) {
			return [{ ...note, endBeat: newEndBeat - absoluteOffset }];
		}

		return [note];
	});

	return new HealPattern(pattern, resolvedThreshold, transformed);
}
