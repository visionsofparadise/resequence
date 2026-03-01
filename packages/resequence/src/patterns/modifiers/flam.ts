import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface FlamProperties extends ModifierProperties {
	readonly flamOffset: number;
	readonly graceVelocity: number;
}

export class FlamPattern extends ModifierPattern {
	readonly properties: FlamProperties;

	constructor(properties: OptionalProperties<FlamProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): FlamPattern {
		return new FlamPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function flam(pattern: Pattern | ScoreNote, flamOffset: number, graceVelocity = 40): FlamPattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note) => [
		{
			...note,
			startBeat: note.startBeat - flamOffset,
			endBeat: note.startBeat,
			velocity: graceVelocity,
			slides: undefined,
		},
		note,
	]);

	return new FlamPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		flamOffset,
		graceVelocity,
		input: resolved,
	});
}
