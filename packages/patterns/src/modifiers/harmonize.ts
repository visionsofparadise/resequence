import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { addSteps, NUM_OCTAVES } from "../pitch";
import { flatModifyNotes } from "../utils/modify";

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
