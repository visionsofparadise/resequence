import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { PatternNode, RelativeNote } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { collectNotes, flatMapNotes } from "../utils/tree";

export class SlicePattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
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

export function slice(pattern: Pattern, from: number, to: number): SlicePattern {
	const allNotes = collectNotes(pattern);
	const sorted = allNotes.slice().sort((noteA, noteB) => noteA.startBeat - noteB.startBeat);
	const kept = sorted.slice(from, to);

	if (kept.length === 0) {
		return new SlicePattern(pattern, from, to, { notes: [], children: [], startBeat: 0, endBeat: 0 });
	}

	const firstEntry = kept[0];
	const lastNote = kept[kept.length - 1];

	if (!firstEntry || !lastNote) {
		return new SlicePattern(pattern, from, to, { notes: [], children: [], startBeat: 0, endBeat: 0 });
	}

	const firstTick = firstEntry.startBeat;
	const durationBeats = lastNote.endBeat - firstTick;
	const notes: Array<RelativeNote> = kept.map((scoreNote) => ({
		offsetBeats: 0,
		note: { ...scoreNote, startBeat: scoreNote.startBeat - firstTick, endBeat: scoreNote.endBeat - firstTick },
	}));

	return new SlicePattern(pattern, from, to, { notes, children: [], startBeat: 0, endBeat: durationBeats });
}

export class TrimPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
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

export function trim(pattern: Pattern, from: Duration | number, to: Duration | number): TrimPattern {
	const fromBeats = resolveDuration(from);
	const toBeats = resolveDuration(to);

	const transformed = flatMapNotes(pattern, (note, absoluteOffset) => {
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
