import type { Instrument } from "../instrument/instrument";

export interface EffectsGraphEntry {
	readonly input: AudioNode;
	readonly nodes: ReadonlyMap<string, AudioNode>;
}

export interface ScheduleContext {
	readonly audioContext: BaseAudioContext;
	readonly sampleBank: ReadonlyMap<string, AudioBuffer>;
	readonly effectsMap: ReadonlyMap<string, EffectsGraphEntry>;
	readonly tempo: number;
	readonly fromTicks: number;
	readonly toTicks: number;
	readonly trackFilter?: ReadonlySet<string>;
	readonly instrument?: Instrument;
}
