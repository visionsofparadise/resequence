import type { NoteEvent, UnitContext, MidiUnitInput } from "@resequence/web-au-core";
import { MidiUnit } from "@resequence/web-au-core";
import { z } from "zod";

const harmonizeSchema = z.object({
	intervals: z.array(z.number()).default([]).describe("Intervals (semitones)"),
});

export class HarmonizeMidiUnit extends MidiUnit<typeof harmonizeSchema> {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "harmonize";

	constructor(input: z.infer<typeof harmonizeSchema> & MidiUnitInput) {
		super(input, harmonizeSchema);
	}

	override schedule(noteEvent: NoteEvent, context: UnitContext): void {
		super.schedule(noteEvent, context);

		for (const interval of this.parameters.intervals.value) {
			const transposed: NoteEvent = { ...noteEvent, note: noteEvent.note + interval };

			super.schedule(transposed, context);
		}
	}
}

export function harmonize(intervals: ReadonlyArray<number>): HarmonizeMidiUnit {
	return new HarmonizeMidiUnit({ intervals: [...intervals] });
}
