import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";

function mulberry32(seed: number): () => number {
	let state = seed;
	return function (): number {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export class JitterPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly amount: number,
		readonly seed: number | undefined,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): JitterPattern {
		return new JitterPattern(this.source, this.amount, this.seed, this.overrideNode(overrides));
	}
}

export function jitter(pattern: Pattern | ScoreNote, amount: number, seed?: number): JitterPattern {
	const resolved = toPattern(pattern);
	const rng = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);

	const transformed = mapNotes(resolved, (note) => {
		const shift = Math.round((rng() * 2 - 1) * amount);
		return {
			...note,
			startBeat: note.startBeat + shift,
			endBeat: note.endBeat + shift,
		};
	});

	return new JitterPattern(pattern, amount, seed, transformed);
}
