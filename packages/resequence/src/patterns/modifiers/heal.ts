;
;
import { pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes, walkNotes } from "../utils/tree";

export class HealPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly threshold: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): HealPattern {
		return new HealPattern(this.source, this.threshold, this.overrideNode(overrides));
	}
}

export function heal(pattern: Pattern | ScoreNote, threshold?: number): HealPattern {
	const resolved = toPattern(pattern);
	const resolvedThreshold = threshold ?? 0;
	const entries: Array<{ id: string; absoluteStart: number; absoluteEnd: number; key: number }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, absoluteEnd: absoluteOffset + note.endBeat, key: pitchKey(note.pitch) });
	});
	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart || ea.key - eb.key);

	const merged = new Set<string>();
	const extensions = new Map<string, number>();

	let last: typeof entries[number] | undefined;

	for (const entry of entries) {
		if (last !== undefined) {
			const prevEnd = last.absoluteEnd;
			const gap = entry.absoluteStart - prevEnd;

			if (last.key === entry.key && gap <= resolvedThreshold) {
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

	return new HealPattern(pattern, resolvedThreshold, transformed);
}
