import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, modifyNotes, collectNotes } from "@resequence/patterns-core";
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

export interface LevelProperties extends ModifierProperties {
	readonly config: LevelConfig;
}

export class LevelPattern extends ModifierPattern<LevelProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "level";

	override _setup(): Array<Event> {
		const config = this.properties.config;
		let velocityMean = 0;
		const ccMeans = new Map<number, number>();

		const needsCollect = (config.velocity !== undefined && needsMean(config.velocity)) || (config.cc && Object.values(config.cc).some((spec) => spec !== undefined && needsMean(spec)));

		if (needsCollect) {
			const allNotes = collectNotes(this);

			if (allNotes.length > 0) {
				if (config.velocity !== undefined && needsMean(config.velocity)) {
					velocityMean = allNotes.reduce((sum, { note }) => sum + note.velocity, 0) / allNotes.length;
				}

				if (config.cc) {
					for (const [ccKey, ccSpec] of Object.entries(config.cc)) {
						if (ccSpec === undefined || !needsMean(ccSpec)) continue;
						const ccNum = Number(ccKey);

						ccMeans.set(ccNum, allNotes.reduce((sum, { note }) => sum + (note.cc?.[ccNum] ?? 0), 0) / allNotes.length);
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

		modifyNotes(this, (note) => {
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

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): LevelPattern {
		return new LevelPattern({ config: this.properties.config, input: this.properties.input });
	}
}

export function level(pattern: Pattern | Note, config: LevelConfig): LevelPattern {
	const resolved = toPattern(pattern);

	return new LevelPattern({ config, input: resolved });
}

export function humanize(pattern: Pattern | Note, amount: number, seed?: number): LevelPattern {
	return level(pattern, { velocity: { randomize: amount, seed } });
}
