import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes, walkNotes } from "@resequence/patterns-core";
export interface PolyphonyProperties extends ModifierProperties {
	readonly max: number;
	readonly isGreedy: boolean;
}

export class PolyphonyPattern extends ModifierPattern<PolyphonyProperties> {
	readonly type = ["pattern", "midi", "modifier", "polyphony"] as const;

	static override is(value: unknown): value is PolyphonyPattern {
		return ModifierPattern.is(value) && value.type[3] === "polyphony";
	}

	clone(overrides: Partial<PatternProperties>): PolyphonyPattern {
		return new PolyphonyPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function polyphony(pattern: Pattern | Note, max: number, isGreedy = false): PolyphonyPattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number; absoluteEnd: number }> = [];

	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, absoluteEnd: absoluteOffset + note.endBeat });
	});
	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);

	const kept = new Set<string>();
	const active: typeof entries = [];

	for (const entry of entries) {
		const stillActive = active.filter((keptEntry) => keptEntry.absoluteStart <= entry.absoluteStart && entry.absoluteStart < keptEntry.absoluteEnd);

		if (stillActive.length < max) {
			kept.add(entry.id);
			active.push(entry);
		} else if (isGreedy) {
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

	const cloned = resolved.clone({});

	flatModifyNotes(cloned, (note, { id }) => {
		if (kept.has(id)) return [note];

		return [];
	});

	return new PolyphonyPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		max,
		isGreedy,
		input: resolved,
	});
}
