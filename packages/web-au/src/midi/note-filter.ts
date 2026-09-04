import { MidiUnit } from "@resequence/web-au-core";
import { z } from "zod";
import type { NoteEvent, UnitContext, MidiUnitInput } from "@resequence/web-au-core";

const noteFilterSchema = z.object({});

export class NoteFilterMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "note-filter";

	readonly predicate: (noteEvent: NoteEvent) => boolean;

	constructor(input: { predicate: (noteEvent: NoteEvent) => boolean } & MidiUnitInput) {
		super(input, noteFilterSchema);
		this.predicate = input.predicate;
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
