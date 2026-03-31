import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
export interface StretchProperties extends ModifierProperties {
	readonly factor: number;
}

export class StretchPattern extends ModifierPattern<StretchProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "stretch";

	override _setup(): Array<Event> {
		modifyNotes(this, (note) => ({
			...note,
			startBeat: note.startBeat * this.properties.factor,
			endBeat: note.endBeat * this.properties.factor,
			slides: note.slides?.map((sl) => ({ ...sl, beat: sl.beat * this.properties.factor })),
		}));

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): StretchPattern {
		return new StretchPattern({ factor: this.properties.factor, input: this.properties.input });
	}
}

export function stretch(pattern: Pattern | Note, factor: number): StretchPattern {
	const resolved = toPattern(pattern);

	return new StretchPattern({ factor, input: resolved });
}
