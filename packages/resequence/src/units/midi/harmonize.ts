import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";

export interface HarmonizeMidiOptions {
	readonly intervals: ReadonlyArray<number>;
}

export class HarmonizeMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "harmonize"] as const;

	static is(value: unknown): value is HarmonizeMidiUnit {
		return MidiUnit.is(value) && value.type[2] === "harmonize";
	}

	public readonly intervals: ReadonlyArray<number>;

	constructor(intervals: ReadonlyArray<number>) {
		super();
		this.intervals = intervals;
	}

	override schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		super.schedule(voiceNote, scheduleContext);

		for (const interval of this.intervals) {
			const transposed: VoiceNote = { ...voiceNote, note: voiceNote.note + interval };
			super.schedule(transposed, scheduleContext);
		}
	}
}

export function harmonize(intervals: ReadonlyArray<number>): HarmonizeMidiUnit {
	return new HarmonizeMidiUnit(intervals);
}
