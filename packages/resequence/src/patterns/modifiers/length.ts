import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface LengthProperties extends ModifierProperties {
	readonly noteDuration: number;
}

export class LengthPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "length"] as const;
	readonly properties: LengthProperties;

	static is(value: unknown): value is LengthPattern {
		return ModifierPattern.is(value) && value.type[3] === "length";
	}

	constructor(properties: OptionalProperties<LengthProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): LengthPattern {
		return new LengthPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function length(pattern: Pattern | ScoreNote, duration: number): LengthPattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => {
		const truncatedSlides = note.slides?.filter((sl) => sl.beat <= duration);
		return {
			...note,
			endBeat: note.startBeat + duration,
			slides: truncatedSlides && truncatedSlides.length > 0 ? truncatedSlides : undefined,
		};
	});

	return new LengthPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		noteDuration: duration,
		input: resolved,
	});
}
