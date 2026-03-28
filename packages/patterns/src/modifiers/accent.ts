import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { modifyNotes } from "../utils/modify";

export interface AccentProperties extends ModifierProperties {
	readonly positions: ReadonlyArray<number>;
	readonly amount: number;
}

export class AccentPattern extends ModifierPattern<AccentProperties> {
	readonly type = ["pattern", "midi", "modifier", "accent"] as const;

	static override is(value: unknown): value is AccentPattern {
		return ModifierPattern.is(value) && value.type[3] === "accent";
	}

	clone(overrides: Partial<PatternProperties>): AccentPattern {
		return new AccentPattern({
			...this.properties,
			...overrides,
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

	const cloned = resolved.clone({});

	modifyNotes(cloned, (note, { absoluteOffset }) => {
		if (accentedTicks.has(absoluteOffset + note.startBeat)) {
			return { ...note, velocity: Math.min(127, note.velocity + amount) };
		}

		return note;
	});

	return new AccentPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		positions,
		amount,
		input: resolved,
	});
}
