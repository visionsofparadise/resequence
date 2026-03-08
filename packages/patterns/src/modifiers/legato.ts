import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";
import { walkNotes } from "../utils/walk";

export interface LegatoProperties extends ModifierProperties {
	readonly extendLast: boolean;
}

export class LegatoPattern extends ModifierPattern<LegatoProperties> {
	readonly type = ["pattern", "midi", "modifier", "legato"] as const;

	static override is(value: unknown): value is LegatoPattern {
		return ModifierPattern.is(value) && value.type[3] === "legato";
	}

	clone(overrides: Partial<PatternProperties>): LegatoPattern {
		return new LegatoPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function legato(pattern: Pattern | Note, extendLast = true): LegatoPattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat });
	});
	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);
	const totalDuration = pattern.endBeat - pattern.startBeat;

	const endBeatMap = new Map<string, number>();

	for (let noteIndex = 0; noteIndex < entries.length; noteIndex++) {
		const entry = entries[noteIndex];
		if (!entry) continue;
		const nextEntry = entries[noteIndex + 1];

		if (nextEntry) {
			endBeatMap.set(entry.id, nextEntry.absoluteStart);
		} else if (extendLast) {
			endBeatMap.set(entry.id, totalDuration);
		}
	}

	const transformed = mapNotes(resolved, (note, { id, absoluteOffset }) => {
		const newAbsEnd = endBeatMap.get(id);

		if (newAbsEnd !== undefined) {
			return { ...note, endBeat: newAbsEnd - absoluteOffset };
		}

		return note;
	});

	return new LegatoPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		extendLast,
		input: resolved,
	});
}
