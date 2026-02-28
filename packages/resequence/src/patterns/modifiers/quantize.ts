import { N } from "../../utils/chromatic";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import { note } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { sequence } from "../sequence";
import { collectNotes, mapNotes } from "../utils/tree";

export class QuantizePattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly subdivision: number,
		readonly grooveMap: Pattern | undefined,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): QuantizePattern {
		return new QuantizePattern(this.source, this.subdivision, this.grooveMap, this.overrideNode(overrides));
	}
}

export function quantize(pattern: Pattern, subdivision: Duration | number, grooveMap?: Pattern): QuantizePattern {
	const grid = resolveDuration(subdivision);

	let transformed: Pattern;

	if (!grooveMap) {
		transformed = mapNotes(pattern, (note, absoluteOffset) => {
			const absBeat = absoluteOffset + note.startBeat;
			const remainder = absBeat % grid;
			const snapped = absBeat - remainder + (remainder <= grid / 2 ? 0 : grid);
			const shift = snapped - absBeat;
			return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
		});
	} else {
		const groovePositions = collectNotes(grooveMap).map((grooveNote) => grooveNote.startBeat % grid).sort((tickA, tickB) => tickA - tickB);

		transformed = mapNotes(pattern, (note, absoluteOffset) => {
			const absBeat = absoluteOffset + note.startBeat;
			const cycle = Math.floor(absBeat / grid);
			const remainder = absBeat % grid;
			const nearest = groovePositions.reduce((best, grooveTick) => (Math.abs(grooveTick - remainder) < Math.abs(best - remainder) ? grooveTick : best), groovePositions[0] ?? 0);
			const shift = cycle * grid + nearest - absBeat;
			return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
		});
	}

	return new QuantizePattern(pattern, grid, grooveMap, transformed);
}

function buildSwingMap(amount: number): Pattern {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return sequence(note(N.C4!.pitch, amount), note(N.C4!.pitch, 1 - amount));
}

export function shuffle(pattern: Pattern, amount: number): QuantizePattern {
	return quantize(pattern, "4n", buildSwingMap(amount));
}
