import { pitchKey } from "../../utils/pitch";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { collectNotes, mapNotes } from "../utils/tree";

export class RotatePattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly steps: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): RotatePattern {
		return new RotatePattern(this.source, this.steps, this.overrideNode(overrides));
	}
}

export function rotate(pattern: Pattern, steps: number): RotatePattern {
	const allNotes = collectNotes(pattern);
	const sorted = allNotes.slice().sort((noteA, noteB) => noteA.startBeat - noteB.startBeat);

	if (sorted.length === 0) {
		return new RotatePattern(pattern, steps, pattern);
	}

	const totalDuration = pattern.endBeat - pattern.startBeat;
	const noteCount = sorted.length;
	const firstNote = sorted[0];

	if (!firstNote) {
		return new RotatePattern(pattern, steps, pattern);
	}

	const gaps: Array<number> = [];

	for (let gapIndex = 0; gapIndex < noteCount; gapIndex++) {
		const curr = sorted[gapIndex];
		if (!curr) continue;

		if (gapIndex < noteCount - 1) {
			const next = sorted[gapIndex + 1];
			if (!next) continue;
			gaps.push(next.startBeat - curr.startBeat);
		} else {
			gaps.push(totalDuration - curr.startBeat + firstNote.startBeat);
		}
	}

	const shift = ((steps % noteCount) + noteCount) % noteCount;
	const rotatedNotes = [...sorted.slice(shift), ...sorted.slice(0, shift)];
	const rotatedGaps = [...gaps.slice(shift), ...gaps.slice(0, shift)];

	const beatAssignment = new Map<string, number>();
	let beat = 0;

	for (let noteIndex = 0; noteIndex < noteCount; noteIndex++) {
		const rotatedNote = rotatedNotes[noteIndex];
		const rotatedGap = rotatedGaps[noteIndex];
		if (!rotatedNote || rotatedGap === undefined) continue;

		const key = `${rotatedNote.startBeat}:${rotatedNote.endBeat}:${pitchKey(rotatedNote.pitch)}`;
		beatAssignment.set(key, beat);
		beat += rotatedGap;
	}

	const transformed = mapNotes(pattern, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const key = `${absStart}:${absEnd}:${pitchKey(note.pitch)}`;
		const newAbsBeat = beatAssignment.get(key);

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
