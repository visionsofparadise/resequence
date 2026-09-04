import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
import type { Event, Note, Pattern, PatternProperties } from "@resequence/patterns-core";

export class ReversePattern extends ModifierPattern {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "reverse";

	override _setup(): Array<Event> {
		const totalDuration = this.endBeat - this.startBeat;

		modifyNotes(this, (note, { absoluteOffset }) => {
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

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): ReversePattern {
		return new ReversePattern({ input: this.properties.input });
	}
}

export function reverse(pattern: Pattern | Note): ReversePattern {
	const resolved = toPattern(pattern);

	return new ReversePattern({ input: resolved });
}
