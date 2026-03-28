import type { MidiUnitProperties, NoteEvent, UnitContext } from "@resequence/web-au-core";

import { MidiUnit, type MidiUnitInput } from "@resequence/web-au-core";

export interface NoteFilterProperties extends MidiUnitProperties {
	readonly predicate: (noteEvent: NoteEvent) => boolean;
}

export class NoteFilterMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "note-filter"] as const;
	declare readonly properties: NoteFilterProperties;

	static override is(value: unknown): value is NoteFilterMidiUnit {
		return MidiUnit.is(value) && value.type[2] === "note-filter";
	}

	get predicate(): (noteEvent: NoteEvent) => boolean {
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

	override schedule(noteEvent: NoteEvent, context: UnitContext): void {
		if (this.predicate(noteEvent)) {
			super.schedule(noteEvent, context);
		}
	}
}

export function noteFilter(predicate: (noteEvent: NoteEvent) => boolean): NoteFilterMidiUnit {
	return new NoteFilterMidiUnit({ predicate });
}
