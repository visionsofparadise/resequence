import type { EnvelopesChain } from "../instrument/envelope";
import type { Instrument } from "../instrument/instrument";

export interface EffectsGraphEntry {
	readonly input: AudioNode;
	readonly nodes: Readonly<Record<string, AudioNode>>;
	readonly envelopes?: EnvelopesChain;
}

export interface ScheduleContext {
	readonly audioContext: BaseAudioContext;
	readonly sampleBank: ReadonlyMap<string, AudioBuffer>;
	readonly effectsMap: Readonly<Record<string, EffectsGraphEntry>>;
	readonly tempo: number;
	readonly fromTicks: number;
	readonly toTicks: number;
	readonly trackFilter?: ReadonlySet<string>;
	readonly instrument?: Instrument;
}
