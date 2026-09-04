import { ModifierPattern, toPattern, addSteps, NUM_OCTAVES, flatModifyNotes } from "@resequence/patterns-core";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface HarmonizeProperties extends ModifierProperties {
	readonly interval: number;
}

export class HarmonizePattern extends ModifierPattern<HarmonizeProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "harmonize";

	override _setup(): Array<Event> {
		flatModifyNotes(this, (note) => [
			note,
			{
				...note,
				pitch: addSteps(note.pitch, this.properties.interval),
				slides: note.slides?.map((sl) => ({
					...sl,
					value: sl.value + this.properties.interval / (note.pitch.stepsPerOctave * NUM_OCTAVES),
				})),
			},
		]);

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
