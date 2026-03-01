import { addSteps, NUM_OCTAVES } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import type { OptionalProperties } from "../../utils/RequiredProperties";
import { mapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface TransposeProperties extends ModifierProperties {
	readonly interval: number;
}

export class TransposePattern extends ModifierPattern {
	readonly properties: TransposeProperties;

	constructor(properties: OptionalProperties<TransposeProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): TransposePattern {
		return new TransposePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function transpose(pattern: Pattern | ScoreNote, interval: number): TransposePattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		pitch: addSteps(note.pitch, interval),
		slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + interval / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
	}));

	return new TransposePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		interval,
		input: resolved,
	});
}
