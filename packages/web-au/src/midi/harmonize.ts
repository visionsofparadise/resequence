import type { MidiUnitProperties, NoteEvent, UnitContext } from "@resequence/web-au-core";

import { MidiUnit, type MidiUnitInput } from "@resequence/web-au-core";

export interface HarmonizeProperties extends MidiUnitProperties {
	readonly intervals: ReadonlyArray<number>;
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
