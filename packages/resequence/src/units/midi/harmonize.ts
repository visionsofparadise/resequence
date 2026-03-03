import type { ScheduleContext } from "../../rendering/schedule-context";
import type { MidiUnitProperties, VoiceNote } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";

export interface HarmonizeMidiOptions {
	readonly intervals: ReadonlyArray<number>;
}

export interface HarmonizeProperties extends MidiUnitProperties {
	readonly intervals: ReadonlyArray<number>;
}

export class HarmonizeMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "harmonize"] as const;
	readonly properties: HarmonizeProperties;

	static is(value: unknown): value is HarmonizeMidiUnit {
		return MidiUnit.is(value) && value.type[2] === "harmonize";
	}

	get intervals(): ReadonlyArray<number> {
		return this.properties.intervals;
	}

	constructor(properties: MidiUnitInput<HarmonizeProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
	}

	clone(overrides?: Partial<HarmonizeProperties>): HarmonizeMidiUnit {
		return new HarmonizeMidiUnit({ ...this.properties, ...overrides });
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
	return new HarmonizeMidiUnit({ intervals });
}
