import type { ScheduleContext } from "../../rendering/schedule-context";
import { MidiUnit } from "../midi-unit";
import type { VoiceNote } from "../midi-unit";
import type { Unit } from "../unit";

export class NoteFilterMidiUnit extends MidiUnit {
	readonly type = "note-filter-midi" as const;
	readonly id = undefined;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	public readonly predicate: (voiceNote: VoiceNote) => boolean;

	constructor(predicate: (voiceNote: VoiceNote) => boolean) {
		super();
		this.predicate = predicate;
	}

	override schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		if (this.predicate(voiceNote)) {
			super.schedule(voiceNote, scheduleContext);
		}
	}

	protected _schedule(): void {
		// no-op — filtering handled in schedule() override
	}

	protected _setup(): void {
		// no audio nodes
	}

	protected _teardown(): void {
		// no audio nodes
	}
}

export function noteFilter(predicate: (voiceNote: VoiceNote) => boolean): NoteFilterMidiUnit {
	return new NoteFilterMidiUnit(predicate);
}
