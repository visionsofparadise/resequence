import type { TuningConfig } from "../utils/pitch";
import type { TempoMap } from "./tempo-map";

export interface ScheduleContext {
	readonly audioContext: BaseAudioContext;
	readonly sampleMap: ReadonlyMap<string, AudioBuffer>;
	readonly driverMap: Map<string, ConstantSourceNode>;
	readonly tempoMap: TempoMap;
	readonly fromBeats: number;
	readonly toBeats: number;
	readonly tuning?: TuningConfig;
	readonly trackFilter?: ReadonlySet<string>;
}
