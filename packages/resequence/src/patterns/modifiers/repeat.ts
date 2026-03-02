import type { OptionalProperties } from "../../utils/RequiredProperties";
import { ResequenceError } from "../../error";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface RepeatProperties extends ModifierProperties {
	readonly count: number;
}

export class RepeatPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "repeat"] as const;
	readonly properties: RepeatProperties;

	static is(value: unknown): value is RepeatPattern {
		return ModifierPattern.is(value) && value.type[3] === "repeat";
	}

	constructor(properties: OptionalProperties<RepeatProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): RepeatPattern {
		return new RepeatPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function repeat(pattern: Pattern | ScoreNote, count: number): RepeatPattern {
	const resolved = toPattern(pattern);
	if (count < 1 || !Number.isInteger(count)) {
		throw new ResequenceError("INVALID_REPEAT_COUNT", `repeat(): count must be a positive integer, got ${count}`);
	}

	const durationBeats = pattern.endBeat - pattern.startBeat;

	const transformed = flatMapNotes(resolved, (note) => {
		const copies = [];

		for (let index = 0; index < count; index++) {
			copies.push({ ...note, startBeat: note.startBeat + durationBeats * index, endBeat: note.endBeat + durationBeats * index });
		}

		return copies;
	});

	return new RepeatPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		count,
		input: resolved,
	});
}
