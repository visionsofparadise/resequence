import type { MidiUnit } from "../units/midi-unit";
import type { ScoreNote } from "../patterns/note";
import type { TuningConfig } from "../utils/pitch";
import type { TempoMap } from "./tempo-map";

export type NoteDispatch = (note: ScoreNote, offsetBeats: number, outputs: ReadonlyArray<MidiUnit>, context: ScheduleContext) => void;

export interface ScheduleContext {
	readonly audioContext: BaseAudioContext;
	readonly sampleMap: Map<string, AudioBuffer>;
	readonly driverMap: Map<string, ConstantSourceNode>;
	readonly tempoMap: TempoMap;
	readonly fromBeats: number;
	readonly toBeats: number;
	readonly tuning?: TuningConfig;
	readonly trackFilter?: ReadonlySet<string>;
	readonly outputs: ReadonlyArray<MidiUnit>;
	readonly dispatch: NoteDispatch;
	readonly getSample: (path: string) => Promise<AudioBuffer>;
	readonly loadModule: (url: string) => Promise<void>;
}
