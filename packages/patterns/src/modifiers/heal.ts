import type { Note } from "../note";
import { pitchKey } from "../pitch";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { flatMapNotes } from "../utils/map";
import { walkNotes } from "../utils/walk";

export interface HealProperties extends ModifierProperties {
	readonly threshold: number;
}

export class HealPattern extends ModifierPattern<HealProperties> {
	static is(value: unknown): value is HealPattern {
		return value instanceof HealPattern;
	}

	clone(overrides: Partial<PatternProperties>): HealPattern {
		return new HealPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function heal(pattern: Pattern | Note, threshold?: number): HealPattern {
	const resolved = toPattern(pattern);
	const resolvedThreshold = threshold ?? 0;
	const entries: Array<{ id: string; absoluteStart: number; absoluteEnd: number; key: number }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, absoluteEnd: absoluteOffset + note.endBeat, key: pitchKey(note.pitch) });
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

	const transformed = flatMapNotes(resolved, (note, { id, absoluteOffset }) => {
		if (merged.has(id)) return [];

		const newEndBeat = extensions.get(id);
		if (newEndBeat !== undefined) {
			return [{ ...note, endBeat: newEndBeat - absoluteOffset }];
		}

		return [note];
	});

	return new HealPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		threshold: resolvedThreshold,
		input: resolved,
	});
}
