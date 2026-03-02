import type { ScheduleContext } from "../../rendering/schedule-context";
import { MidiUnit } from "../midi-unit";
import type { VoiceNote } from "../midi-unit";

export class NoteFilterMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "note-filter"] as const;

	static is(value: unknown): value is NoteFilterMidiUnit {
		return MidiUnit.is(value) && value.type[2] === "note-filter";
	}

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
}

export function noteFilter(predicate: (voiceNote: VoiceNote) => boolean): NoteFilterMidiUnit {
	return new NoteFilterMidiUnit(predicate);
}
