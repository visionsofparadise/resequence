import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes, flatMapNotes } from "../utils/tree";

export class GatePattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly gateSource: Pattern,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): GatePattern {
		return new GatePattern(this.source, this.gateSource, this.overrideNode(overrides));
	}
}

export function gate(pattern: Pattern | ScoreNote, gatePattern: Pattern): GatePattern {
	const resolved = toPattern(pattern);
	const gateNotes = collectNotes(gatePattern);

	const transformed = flatMapNotes(resolved, (note, absoluteOffset) => {
		const noteStart = absoluteOffset + note.startBeat;
		const noteEnd = absoluteOffset + note.endBeat;
		const result = [];

		for (const gateNote of gateNotes) {
			const winStart = gateNote.startBeat;
			const winEnd = gateNote.endBeat;
			const overlapStart = Math.max(noteStart, winStart);
			const overlapEnd = Math.min(noteEnd, winEnd);

			if (overlapEnd > overlapStart) {
				result.push({
					...note,
					startBeat: overlapStart - absoluteOffset,
					endBeat: overlapEnd - absoluteOffset,
				});
			}
		}

		return result;
	});

	return new GatePattern(pattern, gatePattern, transformed);
}
