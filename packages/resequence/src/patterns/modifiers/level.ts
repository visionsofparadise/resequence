import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes, mapNotes } from "../utils/tree";

export interface LevelPropOptions {
	readonly value?: number;
	readonly randomize?: number;
	readonly expand?: number;
	readonly compress?: number;
	readonly min?: number;
	readonly max?: number;
	readonly seed?: number;
}

export type LevelProp = number | LevelPropOptions;

export interface LevelConfig {
	readonly velocity?: LevelProp;
	readonly cc?: Partial<Record<number, LevelProp>>;
}

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

function applyPropToValue(value: number, spec: LevelProp, mean: number, rng: () => number): number {
	if (typeof spec === "number") return spec;

	let computed = spec.value ?? value;

	const scaleFactor = spec.expand ?? spec.compress;
	if (scaleFactor !== undefined) {
		computed = mean + scaleFactor * (value - mean);
	}

	if (spec.randomize !== undefined) {
		computed += (rng() * 2 - 1) * spec.randomize;
	}

	computed = Math.round(computed);

	if (spec.min !== undefined) computed = Math.max(spec.min, computed);
	if (spec.max !== undefined) computed = Math.min(spec.max, computed);

	return computed;
}

function createRng(spec: LevelProp): () => number {
	if (typeof spec === "number") return Math.random;
	return spec.seed !== undefined ? mulberry32(spec.seed) : Math.random.bind(Math);
}

function needsMean(spec: LevelProp): boolean {
	if (typeof spec === "number") return false;
	return spec.expand !== undefined || spec.compress !== undefined;
}

export class LevelPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly config: LevelConfig,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): LevelPattern {
		return new LevelPattern(this.source, this.config, this.overrideNode(overrides));
	}
}

export function level(pattern: Pattern | ScoreNote, config: LevelConfig): LevelPattern {
	const resolved = toPattern(pattern);
	let velocityMean = 0;
	const ccMeans = new Map<number, number>();

	const needsCollect = (config.velocity !== undefined && needsMean(config.velocity)) ||
		(config.cc && Object.values(config.cc).some((spec) => spec !== undefined && needsMean(spec)));

	if (needsCollect) {
		const allNotes = collectNotes(resolved);
		if (allNotes.length > 0) {
			if (config.velocity !== undefined && needsMean(config.velocity)) {
				velocityMean = allNotes.reduce((sum, scoreNote) => sum + scoreNote.velocity, 0) / allNotes.length;
			}

			if (config.cc) {
				for (const [ccKey, ccSpec] of Object.entries(config.cc)) {
					if (ccSpec === undefined || !needsMean(ccSpec)) continue;
					const ccNum = Number(ccKey);
					ccMeans.set(ccNum, allNotes.reduce((sum, scoreNote) => sum + (scoreNote.cc?.[ccNum] ?? 0), 0) / allNotes.length);
				}
			}
		}
	}

	const velocityRng = config.velocity !== undefined ? createRng(config.velocity) : Math.random;
	const ccRngs = new Map<number, () => number>();

	if (config.cc) {
		for (const [ccKey, ccSpec] of Object.entries(config.cc)) {
			if (ccSpec === undefined) continue;
			ccRngs.set(Number(ccKey), createRng(ccSpec));
		}
	}

	const transformed = mapNotes(resolved, (note) => {
		let velocity = note.velocity;
		let cc = note.cc;

		if (config.velocity !== undefined) {
			velocity = applyPropToValue(note.velocity, config.velocity, velocityMean, velocityRng);
		}

		if (config.cc) {
			const newCc: Partial<Record<number, number>> = { ...cc };

			for (const [ccKey, ccSpec] of Object.entries(config.cc)) {
				if (ccSpec === undefined) continue;
				const ccNum = Number(ccKey);
				const ccRng = ccRngs.get(ccNum) ?? Math.random;
				newCc[ccNum] = applyPropToValue(note.cc?.[ccNum] ?? 0, ccSpec, ccMeans.get(ccNum) ?? 0, ccRng);
			}

			cc = newCc;
		}

		return { ...note, velocity, cc };
	});

	return new LevelPattern(pattern, config, transformed);
}

export function humanize(pattern: Pattern | ScoreNote, amount: number, seed?: number): LevelPattern {
	return level(pattern, { velocity: { randomize: amount, seed } });
}
