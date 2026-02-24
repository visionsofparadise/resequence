import type { Instrument } from "../instrument/instrument";

export interface ScheduleContext {
	readonly audioContext: BaseAudioContext;
	readonly sampleMap: ReadonlyMap<string, AudioBuffer>;
	readonly effectsMap: Readonly<Record<string, AudioNode>>;
	readonly driverMap: Map<string, ConstantSourceNode>;
	readonly tempo: number;
	readonly fromTicks: number;
	readonly toTicks: number;
	readonly trackFilter?: ReadonlySet<string>;
	readonly instrument?: Instrument;
}
