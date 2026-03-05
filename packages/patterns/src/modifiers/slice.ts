import type { Note } from "../note";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { walkPatterns } from "../utils/walk";
import { flatMapNotes } from "../utils/map";

export interface SliceProperties extends ModifierProperties {
	readonly from: number;
	readonly to: number;
}

export class SlicePattern extends ModifierPattern<SliceProperties> {
	static is(value: unknown): value is SlicePattern {
		return value instanceof SlicePattern;
	}

	clone(overrides: Partial<PatternProperties>): SlicePattern {
		return new SlicePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function slice(pattern: Pattern | Note, from: number, to: number): SlicePattern {
	const resolved = toPattern(pattern);

	const entries: Array<{ note: Note; absoluteStart: number; absoluteEnd: number }> = [];
	walkPatterns(resolved, (node, absoluteOffset) => {
		for (const { offsetBeats, note } of node.notes) {
			const totalOffset = absoluteOffset + offsetBeats;
			entries.push({ note, absoluteStart: totalOffset + note.startBeat, absoluteEnd: totalOffset + note.endBeat });
		}
	});

	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);
	const keptEntries = entries.slice(from, to);

	const first = keptEntries[0];
	const last = keptEntries[keptEntries.length - 1];

	if (!first || !last) {
		return new SlicePattern({ notes: [], children: [], startBeat: 0, endBeat: 0, from, to, input: resolved });
	}

	const kept = new Set(keptEntries.map((entry) => entry.note));
	const firstStart = first.absoluteStart;
	const durationBeats = last.absoluteEnd - firstStart;

	const transformed = flatMapNotes(resolved, (note) => {
		if (!kept.has(note)) return [];
		return [{ ...note, startBeat: note.startBeat - firstStart, endBeat: note.endBeat - firstStart }];
	});

	return new SlicePattern({ notes: transformed.notes, children: transformed.children, startBeat: 0, endBeat: durationBeats, from, to, input: resolved });
}
