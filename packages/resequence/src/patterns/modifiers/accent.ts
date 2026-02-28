import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { mapNotes } from "../utils/tree";

export class AccentPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly positions: ReadonlyArray<number>,
		readonly amount: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): AccentPattern {
		return new AccentPattern(this.source, this.positions, this.amount, this.overrideNode(overrides));
	}
}

export function accent(pattern: Pattern, positions: ReadonlyArray<number>, amount: number): AccentPattern {
	const resolvedPositions = positions;
	const totalDuration = pattern.endBeat - pattern.startBeat;
	const cycle = resolvedPositions.reduce((sum, pos) => sum + pos, 0);

	const accentedTicks = new Set<number>();

	if (cycle > 0) {
		const relativeOffsets: Array<number> = [];
		let cursor = 0;

		for (const pos of resolvedPositions) {
			relativeOffsets.push(cursor);
			cursor += pos;
		}

		let start = 0;

		while (start < totalDuration) {
			for (const relOffset of relativeOffsets) {
				accentedTicks.add(start + relOffset);
			}

			start += cycle;
		}
	}

	const transformed = mapNotes(pattern, (note, absoluteOffset) => {
		if (accentedTicks.has(absoluteOffset + note.startBeat)) {
			return { ...note, velocity: Math.min(127, note.velocity + amount) };
		}

		return note;
	});

	return new AccentPattern(pattern, resolvedPositions, amount, transformed);
}
