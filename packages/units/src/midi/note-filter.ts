import type { UnitContext } from "../context";
import type { MidiUnitProperties } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";
import type { NoteEvent } from "../note-event";

export interface NoteFilterProperties extends MidiUnitProperties {
	readonly predicate: (noteEvent: NoteEvent) => boolean;
	readonly previousProperties?: NoteFilterProperties;
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

	clone(overrides?: Partial<NoteFilterProperties>): NoteFilterMidiUnit {
		return new NoteFilterMidiUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
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
