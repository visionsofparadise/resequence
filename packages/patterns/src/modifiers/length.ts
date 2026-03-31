import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
export interface LengthProperties extends ModifierProperties {
	readonly noteDuration: number;
}

export class LengthPattern extends ModifierPattern<LengthProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "length";

	override _setup(): Array<Event> {
		modifyNotes(this, (note) => {
			const truncatedSlides = note.slides?.filter((sl) => sl.beat <= this.properties.noteDuration);

			return {
				...note,
				endBeat: note.startBeat + this.properties.noteDuration,
				slides: truncatedSlides && truncatedSlides.length > 0 ? truncatedSlides : undefined,
			};
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): LengthPattern {
		return new LengthPattern({ noteDuration: this.properties.noteDuration, input: this.properties.input });
	}
}

export function length(pattern: Pattern | Note, duration: number): LengthPattern {
	const resolved = toPattern(pattern);

	return new LengthPattern({ noteDuration: duration, input: resolved });
}
