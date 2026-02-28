import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { collectNotes, mapNotes } from "../utils/tree";

export class LegatoPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly extendLast: boolean,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): LegatoPattern {
		return new LegatoPattern(this.source, this.extendLast, this.overrideNode(overrides));
	}
}

export function legato(pattern: Pattern, extendLast = true): LegatoPattern {
	const allNotes = collectNotes(pattern);
	const sorted = allNotes.slice().sort((noteA, noteB) => noteA.startBeat - noteB.startBeat);
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const endBeatMap = new Map<string, number>();

	for (let noteIndex = 0; noteIndex < sorted.length; noteIndex++) {
		const scoreNote = sorted[noteIndex];
		if (!scoreNote) continue;
		const nextNote = sorted[noteIndex + 1];
		const key = `${scoreNote.startBeat}:${scoreNote.endBeat}:${scoreNote.velocity}`;

		if (nextNote) {
			endBeatMap.set(key, nextNote.startBeat);
		} else if (extendLast) {
			endBeatMap.set(key, totalDuration);
		}
	}

	const transformed = mapNotes(pattern, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const key = `${absStart}:${absEnd}:${note.velocity}`;
		const newAbsEnd = endBeatMap.get(key);

		if (newAbsEnd !== undefined) {
			return { ...note, endBeat: newAbsEnd - absoluteOffset };
		}

		return note;
	});

	return new LegatoPattern(pattern, extendLast, transformed);
}
