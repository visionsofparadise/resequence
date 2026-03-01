import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface StretchProperties extends ModifierProperties {
	readonly factor: number;
}

export class StretchPattern extends ModifierPattern {
	readonly properties: StretchProperties;

	constructor(properties: OptionalProperties<StretchProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): StretchPattern {
		return new StretchPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function stretch(pattern: Pattern | ScoreNote, factor: number): StretchPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		startBeat: note.startBeat * factor,
		endBeat: note.endBeat * factor,
		slides: note.slides?.map((sl) => ({ ...sl, beat: sl.beat * factor })),
	}));

	return new StretchPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		factor,
		input: resolved,
	});
}
