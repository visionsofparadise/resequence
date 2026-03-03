import type { ScheduleContext } from "../../rendering/schedule-context";
import type { MidiUnitProperties, VoiceNote } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";

export interface NoteFilterProperties extends MidiUnitProperties {
	readonly predicate: (voiceNote: VoiceNote) => boolean;
}

export class NoteFilterMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "note-filter"] as const;
	readonly properties: NoteFilterProperties;

	static is(value: unknown): value is NoteFilterMidiUnit {
		return MidiUnit.is(value) && value.type[2] === "note-filter";
	}

	get predicate(): (voiceNote: VoiceNote) => boolean {
		return this.properties.predicate;
	}

	constructor(properties: MidiUnitInput<NoteFilterProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
	}

	clone(overrides?: Partial<NoteFilterProperties>): NoteFilterMidiUnit {
		return new NoteFilterMidiUnit({ ...this.properties, ...overrides });
	}

	override schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		if (this.predicate(voiceNote)) {
			super.schedule(voiceNote, scheduleContext);
		}
	}
}

export function noteFilter(predicate: (voiceNote: VoiceNote) => boolean): NoteFilterMidiUnit {
	return new NoteFilterMidiUnit({ predicate });
}
