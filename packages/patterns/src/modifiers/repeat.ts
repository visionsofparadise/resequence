import { PatternsError } from "../error";
import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { flatModifyNotes } from "../utils/modify";

export interface RepeatProperties extends ModifierProperties {
	readonly count: number;
}

export class RepeatPattern extends ModifierPattern<RepeatProperties> {
	readonly type = ["pattern", "midi", "modifier", "repeat"] as const;

	static override is(value: unknown): value is RepeatPattern {
		return ModifierPattern.is(value) && value.type[3] === "repeat";
	}

	clone(overrides: Partial<PatternProperties>): RepeatPattern {
		return new RepeatPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function repeat(pattern: Pattern | Note, count: number): RepeatPattern {
	const resolved = toPattern(pattern);

	if (count < 1 || !Number.isInteger(count)) {
		throw new PatternsError("INVALID_REPEAT_COUNT", `repeat(): count must be a positive integer, got ${count}`);
	}

	const durationBeats = pattern.endBeat - pattern.startBeat;

	const cloned = resolved.clone({});

	flatModifyNotes(cloned, (note) => {
		const copies = [];

		for (let index = 0; index < count; index++) {
			copies.push({ ...note, startBeat: note.startBeat + durationBeats * index, endBeat: note.endBeat + durationBeats * index });
		}

		return copies;
	});

	return new RepeatPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		count,
		input: resolved,
	});
}
