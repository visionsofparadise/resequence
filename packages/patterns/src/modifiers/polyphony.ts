import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes, walkNotes } from "@resequence/patterns-core";
export interface PolyphonyProperties extends ModifierProperties {
	readonly max: number;
	readonly isGreedy: boolean;
}

export class PolyphonyPattern extends ModifierPattern<PolyphonyProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "polyphony";

	override _setup(): Array<Event> {
		const entries: Array<{ id: string; absoluteStart: number; absoluteEnd: number }> = [];

		walkNotes(this, (note, { id, absoluteOffset }) => {
			entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, absoluteEnd: absoluteOffset + note.endBeat });
		});
		entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);

		const kept = new Set<string>();
		const active: typeof entries = [];

		for (const entry of entries) {
			const stillActive = active.filter((keptEntry) => keptEntry.absoluteStart <= entry.absoluteStart && entry.absoluteStart < keptEntry.absoluteEnd);

			if (stillActive.length < this.properties.max) {
				kept.add(entry.id);
				active.push(entry);
			} else if (this.properties.isGreedy) {
				let oldest = stillActive[0];

				if (!oldest) continue;

				for (const activeEntry of stillActive) {
					if (activeEntry.absoluteStart < oldest.absoluteStart) oldest = activeEntry;
				}

				kept.delete(oldest.id);
				const oldestIndex = active.indexOf(oldest);

				if (oldestIndex >= 0) active.splice(oldestIndex, 1);

				kept.add(entry.id);
				active.push(entry);
			}
		}

		flatModifyNotes(this, (note, { id }) => {
			if (kept.has(id)) return [note];

			return [];
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): PolyphonyPattern {
		return new PolyphonyPattern({ max: this.properties.max, isGreedy: this.properties.isGreedy, input: this.properties.input });
	}
}

export function polyphony(pattern: Pattern | Note, max: number, isGreedy = false): PolyphonyPattern {
	const resolved = toPattern(pattern);

	return new PolyphonyPattern({ max, isGreedy, input: resolved });
}
