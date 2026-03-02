import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

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

export class JitterPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "jitter"] as const;
	readonly properties: JitterProperties;

	static is(value: unknown): value is JitterPattern {
		return ModifierPattern.is(value) && value.type[3] === "jitter";
	}

	constructor(properties: OptionalProperties<JitterProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): JitterPattern {
		return new JitterPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
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
