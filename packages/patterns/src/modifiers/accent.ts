import { ModifierPattern, modifyNotes, toPattern } from "@resequence/patterns-core";
import type { Event, ModifierProperties, Note, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface AccentProperties extends ModifierProperties {
	readonly positions: ReadonlyArray<number>;
	readonly amount: number;
}

export class AccentPattern extends ModifierPattern<AccentProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "accent";

	override _setup(): Array<Event> {
		const totalDuration = this.endBeat - this.startBeat;
		const cycle = this.properties.positions.reduce((sum, pos) => sum + pos, 0);

		const accentedTicks = new Set<number>();

		if (cycle > 0) {
			const relativeOffsets: Array<number> = [];
			let cursor = 0;

			for (const pos of this.properties.positions) {
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

		modifyNotes(this, (note, { absoluteOffset }) => {
			if (accentedTicks.has(absoluteOffset + note.startBeat)) {
				return { ...note, velocity: Math.min(127, note.velocity + this.properties.amount) };
			}

			return note;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): AccentPattern {
		return new AccentPattern({
			positions: this.properties.positions,
			amount: this.properties.amount,
			input: this.properties.input,
		});
	}
}

export function accent(pattern: Pattern | Note, positions: ReadonlyArray<number>, amount: number): AccentPattern {
	const resolved = toPattern(pattern);

	return new AccentPattern({ positions, amount, input: resolved });
}
