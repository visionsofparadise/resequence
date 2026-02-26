import type { ScheduleContext } from "../rendering/schedule-context";
import type { Pitch } from "../utils/pitch";
import { Unit } from "./unit";

export interface VoiceNote {
	readonly note: number;
	readonly bend: number;
	readonly velocity: number;
	readonly startMs: number;
	readonly stopMs: number;
	readonly cleanupMs: number;
	readonly lyric?: string;
	readonly pitch?: Pitch;
	readonly attack?: number;
	readonly release?: number;
	readonly sustain?: number;
	readonly cutoff?: number;
	readonly resonance?: number;
	readonly volume?: number;
	readonly expression?: number;
	readonly pan?: number;
	readonly chorus?: number;
	readonly reverb?: number;
	readonly cc?: Partial<Record<number, number>>;
}

export abstract class MidiUnit extends Unit {
	schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		this._schedule(voiceNote, scheduleContext);

		for (const target of this.targets) {
			if (target instanceof MidiUnit) target.schedule(voiceNote, scheduleContext);
		}
	}

	protected abstract _schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void;
}
