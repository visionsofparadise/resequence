import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface AccentProperties extends ModifierProperties {
	readonly positions: ReadonlyArray<number>;
	readonly amount: number;
}

export class AccentPattern extends ModifierPattern {
	readonly properties: AccentProperties;

	constructor(properties: OptionalProperties<AccentProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): AccentPattern {
		return new AccentPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function accent(pattern: Pattern | ScoreNote, positions: ReadonlyArray<number>, amount: number): AccentPattern {
	const resolved = toPattern(pattern);
	const resolvedPositions = positions;
	const totalDuration = pattern.endBeat - pattern.startBeat;
	const cycle = resolvedPositions.reduce((sum, pos) => sum + pos, 0);

	const accentedTicks = new Set<number>();

	if (cycle > 0) {
		const relativeOffsets: Array<number> = [];
		let cursor = 0;

		for (const pos of resolvedPositions) {
			relativeOffsets.push(cursor);
			cursor += pos;
		}

		let start = 0;

		while (start < totalDuration) {
			for (const relOffset of relativeOffsets) {
				accentedTicks.add(start + relOffset);
			}

			start += cycle;
		}
	}

	const transformed = mapNotes(resolved, (note, { absoluteOffset }) => {
		if (accentedTicks.has(absoluteOffset + note.startBeat)) {
			return { ...note, velocity: Math.min(127, note.velocity + amount) };
		}

		return note;
	});

	return new AccentPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		positions: resolvedPositions,
		amount,
		input: resolved,
	});
}
