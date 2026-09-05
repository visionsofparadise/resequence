import { ModifierPattern, toPattern, addSteps, flatModifyNotes } from "@resequence/patterns-core";
import { repitchNote } from "../utils/repitchNote";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface HarmonizeProperties extends ModifierProperties {
	readonly interval: number;
}

export class HarmonizePattern extends ModifierPattern<HarmonizeProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "harmonize";

	override _setup(): Array<Event> {
		flatModifyNotes(this, (note) => [note, repitchNote(note, addSteps(note.pitch, this.properties.interval))]);

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): HarmonizePattern {
		return new HarmonizePattern({ interval: this.properties.interval, input: this.properties.input });
	}
}

export function harmonize(pattern: Pattern | Note, interval: number): HarmonizePattern {
	const resolved = toPattern(pattern);

	return new HarmonizePattern({ interval, input: resolved });
}
