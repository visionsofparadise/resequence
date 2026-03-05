import type { Note } from "../note";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { flatMapNotes } from "../utils/map";
import { walkNotes } from "../utils/walk";

export interface PolyphonyProperties extends ModifierProperties {
	readonly max: number;
	readonly isGreedy: boolean;
}

export class PolyphonyPattern extends ModifierPattern<PolyphonyProperties> {
	static is(value: unknown): value is PolyphonyPattern {
		return value instanceof PolyphonyPattern;
	}

	clone(overrides: Partial<PatternProperties>): PolyphonyPattern {
		return new PolyphonyPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
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

	const transformed = flatMapNotes(resolved, (note, { id }) => {
		if (kept.has(id)) return [note];
		return [];
	});

	return new PolyphonyPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		max,
		isGreedy,
		input: resolved,
	});
}
