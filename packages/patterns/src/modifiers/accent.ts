import type { Note } from "../note";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

export interface AccentProperties extends ModifierProperties {
	readonly positions: ReadonlyArray<number>;
	readonly amount: number;
}

export class AccentPattern extends ModifierPattern<AccentProperties> {
	static is(value: unknown): value is AccentPattern {
		return value instanceof AccentPattern;
	}

	clone(overrides: Partial<PatternProperties>): AccentPattern {
		return new AccentPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function accent(pattern: Pattern | Note, positions: ReadonlyArray<number>, amount: number): AccentPattern {
	const resolved = toPattern(pattern);
	const totalDuration = pattern.endBeat - pattern.startBeat;
	const cycle = positions.reduce((sum, pos) => sum + pos, 0);

	const accentedTicks = new Set<number>();

	if (cycle > 0) {
		const relativeOffsets: Array<number> = [];
		let cursor = 0;

		for (const pos of positions) {
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
		positions,
		amount,
		input: resolved,
	});
}
