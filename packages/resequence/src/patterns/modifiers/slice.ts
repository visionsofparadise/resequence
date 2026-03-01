import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes, walkNodes } from "../utils/tree";

export class SlicePattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly from: number,
		readonly to: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): SlicePattern {
		return new SlicePattern(this.source, this.from, this.to, this.overrideNode(overrides));
	}
}

export function slice(pattern: Pattern | ScoreNote, from: number, to: number): SlicePattern {
	const resolved = toPattern(pattern);

	const entries: Array<{ note: ScoreNote; absoluteStart: number; absoluteEnd: number }> = [];
	walkNodes(resolved, (node, absoluteOffset) => {
		for (const { offsetBeats, note } of node.notes) {
			const totalOffset = absoluteOffset + offsetBeats;
			entries.push({ note, absoluteStart: totalOffset + note.startBeat, absoluteEnd: totalOffset + note.endBeat });
		}
	});

	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);
	const keptEntries = entries.slice(from, to);

	const first = keptEntries[0];
	const last = keptEntries[keptEntries.length - 1];

	if (!first || !last) {
		return new SlicePattern(pattern, from, to, { notes: [], children: [], startBeat: 0, endBeat: 0 });
	}

	const kept = new Set(keptEntries.map((entry) => entry.note));
	const firstStart = first.absoluteStart;
	const durationBeats = last.absoluteEnd - firstStart;

	const transformed = flatMapNotes(resolved, (note) => {
		if (!kept.has(note)) return [];
		return [{ ...note, startBeat: note.startBeat - firstStart, endBeat: note.endBeat - firstStart }];
	});

	return new SlicePattern(pattern, from, to, { notes: transformed.notes, children: transformed.children, startBeat: 0, endBeat: durationBeats });
}

export class TrimPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly fromBeats: number,
		readonly toBeats: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): TrimPattern {
		return new TrimPattern(this.source, this.fromBeats, this.toBeats, this.overrideNode(overrides));
	}
}

export function trim(pattern: Pattern | ScoreNote, fromBeats: number, toBeats: number): TrimPattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note, { absoluteOffset }) => {
		const noteStart = absoluteOffset + note.startBeat;
		const noteEnd = absoluteOffset + note.endBeat;
		const overlapStart = Math.max(noteStart, fromBeats);
		const overlapEnd = Math.min(noteEnd, toBeats);

		if (overlapEnd > overlapStart) {
			return [
				{
					...note,
					startBeat: overlapStart - absoluteOffset - fromBeats,
					endBeat: overlapEnd - absoluteOffset - fromBeats,
				},
			];
		}

		return [];
	});

	const trimDuration = Math.max(0, toBeats - fromBeats);

	return new TrimPattern(pattern, fromBeats, toBeats, { notes: transformed.notes, children: transformed.children, startBeat: 0, endBeat: trimDuration });
}
