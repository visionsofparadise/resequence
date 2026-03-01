import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export class ReversePattern extends ModifierPattern {
	readonly properties: ModifierProperties;

	constructor(properties: OptionalProperties<ModifierProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): ReversePattern {
		return new ReversePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function reverse(pattern: Pattern | ScoreNote): ReversePattern {
	const resolved = toPattern(pattern);
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const transformed = mapNotes(resolved, (note, { absoluteOffset }) => {
		const noteDuration = note.endBeat - note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const newAbsStart = totalDuration - absEnd;
		const newStartBeat = newAbsStart - absoluteOffset;

		return {
			...note,
			startBeat: newStartBeat,
			endBeat: newStartBeat + noteDuration,
		};
	});

	return new ReversePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		input: resolved,
	});
}
