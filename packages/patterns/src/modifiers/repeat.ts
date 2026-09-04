import { PatternsError, ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface RepeatProperties extends ModifierProperties {
	readonly count: number;
}

export class RepeatPattern extends ModifierPattern<RepeatProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "repeat";

	override _setup(): Array<Event> {
		const durationBeats = this.endBeat - this.startBeat;

		flatModifyNotes(this, (note) => {
			const copies = [];

			for (let index = 0; index < this.properties.count; index++) {
				copies.push({
					...note,
					startBeat: note.startBeat + durationBeats * index,
					endBeat: note.endBeat + durationBeats * index,
				});
			}

			return copies;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): RepeatPattern {
		return new RepeatPattern({ count: this.properties.count, input: this.properties.input });
	}
}

export function repeat(pattern: Pattern | Note, count: number): RepeatPattern {
	const resolved = toPattern(pattern);

	if (count < 1 || !Number.isInteger(count)) {
		throw new PatternsError("INVALID_REPEAT_COUNT", `repeat(): count must be a positive integer, got ${count}`);
	}

	return new RepeatPattern({ count, input: resolved });
}
