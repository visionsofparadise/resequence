import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, addSteps, NUM_OCTAVES, flatModifyNotes } from "@resequence/patterns-core";
export interface HarmonizeProperties extends ModifierProperties {
	readonly interval: number;
}

export class HarmonizePattern extends ModifierPattern<HarmonizeProperties> {
	readonly type = ["pattern", "midi", "modifier", "harmonize"] as const;

	static override is(value: unknown): value is HarmonizePattern {
		return ModifierPattern.is(value) && value.type[3] === "harmonize";
	}

	clone(overrides: Partial<PatternProperties>): HarmonizePattern {
		return new HarmonizePattern({
			...this.properties,
			...overrides,
		});
	}
}

export function harmonize(pattern: Pattern | Note, interval: number): HarmonizePattern {
	const resolved = toPattern(pattern);
	const cloned = resolved.clone({});

	flatModifyNotes(cloned, (note) => [
		note,
		{
			...note,
			pitch: addSteps(note.pitch, interval),
			slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + interval / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
		},
	]);

	return new HarmonizePattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		interval,
		input: resolved,
	});
}
