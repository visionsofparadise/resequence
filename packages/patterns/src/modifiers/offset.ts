import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface OffsetProperties extends ModifierProperties {
	readonly amount: number;
}

export class OffsetPattern extends ModifierPattern<OffsetProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "offset";

	override _setup(): Array<Event> {
		modifyNotes(this, (note) => ({
			...note,
			startBeat: note.startBeat + this.properties.amount,
			endBeat: note.endBeat + this.properties.amount,
		}));

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): OffsetPattern {
		return new OffsetPattern({ amount: this.properties.amount, input: this.properties.input });
	}
}

export function offset(pattern: Pattern | Note, amount: number): OffsetPattern {
	const resolved = toPattern(pattern);

	return new OffsetPattern({ amount, input: resolved });
}
