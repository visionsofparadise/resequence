import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes, walkNotes } from "../utils/tree";

export class PolyphonyPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly max: number,
		readonly isGreedy: boolean,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): PolyphonyPattern {
		return new PolyphonyPattern(this.source, this.max, this.isGreedy, this.overrideNode(overrides));
	}
}

export function polyphony(pattern: Pattern | ScoreNote, max: number, isGreedy = false): PolyphonyPattern {
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

	return new PolyphonyPattern(pattern, max, isGreedy, transformed);
}
