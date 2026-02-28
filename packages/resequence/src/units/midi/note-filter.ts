import type { ScheduleContext } from "../../rendering/schedule-context";
import { MidiUnit } from "../midi-unit";
import type { VoiceNote } from "../midi-unit";

export class NoteFilterMidiUnit extends MidiUnit {
	readonly type = "note-filter-midi" as const;

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
