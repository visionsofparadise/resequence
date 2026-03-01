import { addSteps, NUM_OCTAVES } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import type { OptionalProperties } from "../../utils/RequiredProperties";
import { flatMapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface HarmonizeProperties extends ModifierProperties {
	readonly interval: number;
}

export class HarmonizePattern extends ModifierPattern {
	readonly properties: HarmonizeProperties;

	constructor(properties: OptionalProperties<HarmonizeProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): HarmonizePattern {
		return new HarmonizePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function harmonize(pattern: Pattern | ScoreNote, interval: number): HarmonizePattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note) => [
		note,
		{
			...note,
			pitch: addSteps(note.pitch, interval),
			slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + interval / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
		},
	]);

	return new HarmonizePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		interval,
		input: resolved,
	});
}
