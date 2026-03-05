import type { UnitContext } from "../context";
import type { MidiUnitProperties } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";
import type { NoteEvent } from "../note-event";

export interface HarmonizeProperties extends MidiUnitProperties {
	readonly intervals: ReadonlyArray<number>;
	readonly previousProperties?: HarmonizeProperties;
}

export class HarmonizeMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "harmonize"] as const;
	declare readonly properties: HarmonizeProperties;

	static override is(value: unknown): value is HarmonizeMidiUnit {
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
		return new HarmonizeMidiUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	override schedule(noteEvent: NoteEvent, context: UnitContext): void {
		super.schedule(noteEvent, context);

		for (const interval of this.intervals) {
			const transposed: NoteEvent = { ...noteEvent, note: noteEvent.note + interval };
			super.schedule(transposed, context);
		}
	}
}

export function harmonize(intervals: ReadonlyArray<number>): HarmonizeMidiUnit {
	return new HarmonizeMidiUnit({ intervals });
}
