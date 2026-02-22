export interface GainEffect {
	readonly type: "gain";
	readonly level: number;
}

export interface PanEffect {
	readonly type: "pan";
	readonly value: number;
}

export type FilterMode = "lowpass" | "highpass" | "bandpass" | "peaking" | "notch" | "lowshelf" | "highshelf";

export interface FilterEffect {
	readonly type: "filter";
	readonly mode: FilterMode;
	readonly frequency: number;
	readonly resonance?: number;
}

export interface CompressorEffect {
	readonly type: "compressor";
	readonly threshold: number;
	readonly ratio: number;
	readonly attack?: number;
	readonly release?: number;
}

export interface DelayEffect {
	readonly type: "delay";
	readonly time: number;
	readonly feedback?: number;
}

export interface ReverbEffect {
	readonly type: "reverb";
	readonly impulse: string;
}

export type Effect = GainEffect | PanEffect | FilterEffect | CompressorEffect | DelayEffect | ReverbEffect;

export type EffectsChain = Readonly<Record<string, Effect>>;

export function gain({ level }: { level: number }): GainEffect {
	return { type: "gain", level };
}

export function pan({ value }: { value: number }): PanEffect {
	return { type: "pan", value };
}

export function filter({ mode, frequency, resonance }: { mode: FilterMode; frequency: number; resonance?: number }): FilterEffect {
	return { type: "filter", mode, frequency, resonance };
}

export function highpass({ frequency, resonance }: { frequency: number; resonance?: number }): FilterEffect {
	return filter({ mode: "highpass", frequency, resonance });
}

export function lowpass({ frequency, resonance }: { frequency: number; resonance?: number }): FilterEffect {
	return filter({ mode: "lowpass", frequency, resonance });
}

export function compressor({ threshold, ratio, attack, release }: { threshold: number; ratio: number; attack?: number; release?: number }): CompressorEffect {
	return { type: "compressor", threshold, ratio, attack, release };
}

export function delay({ time, feedback }: { time: number; feedback?: number }): DelayEffect {
	return { type: "delay", time, feedback };
}

export function reverb({ impulse }: { impulse: string }): ReverbEffect {
	return { type: "reverb", impulse };
}

export function effects(chain: Record<string, Effect>): EffectsChain {
	return Object.freeze({ ...chain });
}
