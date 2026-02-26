import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { Unit } from "../unit";

export interface HarmonizeMidiOptions {
	readonly intervals: ReadonlyArray<number>;
}

export class HarmonizeMidiUnit extends MidiUnit {
	readonly type = "harmonize-midi" as const;
	readonly id = undefined;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

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

	protected _schedule(): void {
		// no-op — transformation handled in schedule() override
	}

	protected _setup(): void {
		// no audio nodes
	}

	protected _teardown(): void {
		// no audio nodes
	}
}

export function harmonize(intervals: ReadonlyArray<number>): HarmonizeMidiUnit {
	return new HarmonizeMidiUnit(intervals);
}
