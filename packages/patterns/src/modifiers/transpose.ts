import { ModifierPattern, toPattern, addSteps, modifyNotes } from "@resequence/patterns-core";
import { repitchNote } from "../utils/repitchNote";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface TransposeProperties extends ModifierProperties {
	readonly interval: number;
}

export class TransposePattern extends ModifierPattern<TransposeProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "transpose";

	override _setup(): Array<Event> {
		modifyNotes(this, (note) => repitchNote(note, addSteps(note.pitch, this.properties.interval)));

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): TransposePattern {
		return new TransposePattern({ interval: this.properties.interval, input: this.properties.input });
	}
}

export function transpose(pattern: Pattern | Note, interval: number): TransposePattern {
	const resolved = toPattern(pattern);

	return new TransposePattern({ interval, input: resolved });
}
