import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes, walkNotes } from "../utils/tree";

export class LegatoPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly extendLast: boolean,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): LegatoPattern {
		return new LegatoPattern(this.source, this.extendLast, this.overrideNode(overrides));
	}
}

export function legato(pattern: Pattern | ScoreNote, extendLast = true): LegatoPattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat });
	});
	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const endBeatMap = new Map<string, number>();

	for (let noteIndex = 0; noteIndex < entries.length; noteIndex++) {
		const entry = entries[noteIndex];
		if (!entry) continue;
		const nextEntry = entries[noteIndex + 1];

		if (nextEntry) {
			endBeatMap.set(entry.id, nextEntry.absoluteStart);
		} else if (extendLast) {
			endBeatMap.set(entry.id, totalDuration);
		}
	}

	const transformed = mapNotes(resolved, (note, { id, absoluteOffset }) => {
		const newAbsEnd = endBeatMap.get(id);

		if (newAbsEnd !== undefined) {
			return { ...note, endBeat: newAbsEnd - absoluteOffset };
		}

		return note;
	});

	return new LegatoPattern(pattern, extendLast, transformed);
}
