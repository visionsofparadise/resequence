import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

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

export interface JitterProperties extends ModifierProperties {
	readonly amount: number;
	readonly seed: number | undefined;
}

export class JitterPattern extends ModifierPattern<JitterProperties> {
	static is(value: unknown): value is JitterPattern {
		return value instanceof JitterPattern;
	}

	clone(overrides: Partial<PatternProperties>): JitterPattern {
		return new JitterPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function jitter(pattern: Pattern | Note, amount: number, seed?: number): JitterPattern {
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

	return new JitterPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		amount,
		seed,
		input: resolved,
	});
}
