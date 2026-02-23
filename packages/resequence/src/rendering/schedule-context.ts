import type { EnvelopesChain } from "../instrument/envelope";
import type { Instrument } from "../instrument/instrument";

export type EffectsGraphEntry = Readonly<Record<string, AudioNode>>;

export interface ScheduleContext {
	readonly audioContext: BaseAudioContext;
	readonly sampleBank: ReadonlyMap<string, AudioBuffer>;
	readonly effectsMap: Readonly<Record<string, EffectsGraphEntry>>;
	readonly inputMap: Readonly<Record<string, AudioNode>>;
	readonly envelopesMap: Readonly<Record<string, EnvelopesChain>>;
	readonly tempo: number;
	readonly fromTicks: number;
	readonly toTicks: number;
	readonly trackFilter?: ReadonlySet<string>;
	readonly instrument?: Instrument;
}
