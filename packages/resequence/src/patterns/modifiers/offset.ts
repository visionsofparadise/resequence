import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface OffsetProperties extends ModifierProperties {
	readonly amount: number;
}

export class OffsetPattern extends ModifierPattern {
	readonly properties: OffsetProperties;

	constructor(properties: OptionalProperties<OffsetProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): OffsetPattern {
		return new OffsetPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function offset(pattern: Pattern | ScoreNote, amount: number): OffsetPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		startBeat: note.startBeat + amount,
		endBeat: note.endBeat + amount,
	}));

	return new OffsetPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		amount,
		input: resolved,
	});
}
