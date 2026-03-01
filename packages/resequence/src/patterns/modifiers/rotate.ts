import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes, walkNotes } from "../utils/tree";

export class RotatePattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly steps: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): RotatePattern {
		return new RotatePattern(this.source, this.steps, this.overrideNode(overrides));
	}
}

export function rotate(pattern: Pattern | ScoreNote, steps: number): RotatePattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat });
	});
	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);

	if (entries.length === 0) {
		return new RotatePattern(pattern, steps, resolved);
	}

	const totalDuration = pattern.endBeat - pattern.startBeat;
	const noteCount = entries.length;
	const firstEntry = entries[0];

	if (!firstEntry) {
		return new RotatePattern(pattern, steps, resolved);
	}

	const gaps: Array<number> = [];

	for (let gapIndex = 0; gapIndex < noteCount; gapIndex++) {
		const curr = entries[gapIndex];
		if (!curr) continue;

		if (gapIndex < noteCount - 1) {
			const next = entries[gapIndex + 1];
			if (!next) continue;
			gaps.push(next.absoluteStart - curr.absoluteStart);
		} else {
			gaps.push(totalDuration - curr.absoluteStart + firstEntry.absoluteStart);
		}
	}

	const shift = ((steps % noteCount) + noteCount) % noteCount;
	const rotatedEntries = [...entries.slice(shift), ...entries.slice(0, shift)];
	const rotatedGaps = [...gaps.slice(shift), ...gaps.slice(0, shift)];

	const beatAssignment = new Map<string, number>();
	let beat = 0;

	for (let noteIndex = 0; noteIndex < noteCount; noteIndex++) {
		const rotatedEntry = rotatedEntries[noteIndex];
		const rotatedGap = rotatedGaps[noteIndex];
		if (!rotatedEntry || rotatedGap === undefined) continue;

		beatAssignment.set(rotatedEntry.id, beat);
		beat += rotatedGap;
	}

	const transformed = mapNotes(resolved, (note, { id, absoluteOffset }) => {
		const newAbsBeat = beatAssignment.get(id);

		if (newAbsBeat !== undefined) {
			const noteDuration = note.endBeat - note.startBeat;
			return {
				...note,
				startBeat: newAbsBeat - absoluteOffset,
				endBeat: newAbsBeat - absoluteOffset + noteDuration,
			};
		}

		return note;
	});

	return new RotatePattern(pattern, steps, transformed);
}
