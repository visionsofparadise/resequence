import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { PatternsError, ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
export interface RepeatProperties extends ModifierProperties {
	readonly count: number;
}

export class RepeatPattern extends ModifierPattern<RepeatProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "repeat";

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
