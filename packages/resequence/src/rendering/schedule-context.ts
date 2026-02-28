import type { ScoreNote } from "../patterns/note";
import type { MidiUnit } from "../units/midi-unit";
import type { ResolvedTuning } from "../utils/tuning";
import type { TempoMap } from "./tempo-map";

export type NoteDispatch = (note: ScoreNote, offsetBeats: number, outputs: ReadonlyArray<MidiUnit>, context: ScheduleContext) => void;

export interface ScheduleContext {
	readonly audioContext: BaseAudioContext;
	readonly driverMap: Map<string, ConstantSourceNode>;
	readonly tempoMap: TempoMap;
	readonly fromBeats: number;
	readonly toBeats: number;
	readonly tuning?: ResolvedTuning;
	readonly trackFilter?: ReadonlySet<string>;
	readonly outputs: ReadonlyArray<MidiUnit>;
	readonly dispatch: NoteDispatch;
	readonly getSample: (path: string) => Promise<AudioBuffer>;
	readonly loadModule: (url: string) => Promise<void>;
}
