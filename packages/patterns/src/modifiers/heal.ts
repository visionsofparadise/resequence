import { ModifierPattern, toPattern, pitchKey, flatModifyNotes, walkNotes } from "@resequence/patterns-core";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface HealProperties extends ModifierProperties {
	readonly threshold: number;
}

export class HealPattern extends ModifierPattern<HealProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "heal";

	override _setup(): Array<Event> {
		const resolvedThreshold = this.properties.threshold;
		const entries: Array<{ id: string; absoluteStart: number; absoluteEnd: number; key: number }> = [];

		walkNotes(this, (note, { id, absoluteOffset }) => {
			entries.push({
				id,
				absoluteStart: absoluteOffset + note.startBeat,
				absoluteEnd: absoluteOffset + note.endBeat,
				key: pitchKey(note.pitch),
			});
		});
		entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart || ea.key - eb.key);

		const merged = new Set<string>();
		const extensions = new Map<string, number>();

		let last: (typeof entries)[number] | undefined;

		for (const entry of entries) {
			if (last !== undefined) {
				const prevEnd = last.absoluteEnd;
				const gapSize = entry.absoluteStart - prevEnd;

				if (last.key === entry.key && gapSize <= resolvedThreshold) {
					extensions.set(last.id, entry.absoluteEnd);
					merged.add(entry.id);
					last = { ...last, absoluteEnd: entry.absoluteEnd };

					continue;
				}
			}

			last = entry;
		}

		flatModifyNotes(this, (note, { id, absoluteOffset }) => {
			if (merged.has(id)) return [];

			const newEndBeat = extensions.get(id);

			if (newEndBeat !== undefined) {
				return [{ ...note, endBeat: newEndBeat - absoluteOffset }];
			}

			return [note];
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): HealPattern {
		return new HealPattern({ threshold: this.properties.threshold, input: this.properties.input });
	}
}

export function heal(pattern: Pattern | Note, threshold?: number): HealPattern {
	const resolved = toPattern(pattern);
	const resolvedThreshold = threshold ?? 0;

	return new HealPattern({ threshold: resolvedThreshold, input: resolved });
}
