import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";
import { walkNotes } from "../utils/walk";

export interface RotateProperties extends ModifierProperties {
	readonly steps: number;
}

export class RotatePattern extends ModifierPattern<RotateProperties> {
	static is(value: unknown): value is RotatePattern {
		return value instanceof RotatePattern;
	}

	clone(overrides: Partial<PatternProperties>): RotatePattern {
		return new RotatePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function rotate(pattern: Pattern | Note, steps: number): RotatePattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat });
	});
	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);

	if (entries.length === 0) {
		return new RotatePattern({
			notes: resolved.notes,
			children: resolved.children,
			startBeat: resolved.startBeat,
			endBeat: resolved.endBeat,
			steps,
			input: resolved,
		});
	}

	const totalDuration = pattern.endBeat - pattern.startBeat;
	const noteCount = entries.length;
	const firstEntry = entries[0];

	if (!firstEntry) {
		return new RotatePattern({
			notes: resolved.notes,
			children: resolved.children,
			startBeat: resolved.startBeat,
			endBeat: resolved.endBeat,
			steps,
			input: resolved,
		});
	}

	const gaps: Array<number> = [];

	for (let gapIndex = 0; gapIndex < noteCount; gapIndex++) {
		const curr = entries[gapIndex];
		if (!curr) continue;

		if (gapIndex < noteCount - 1) {
			const next = entries[gapIndex + 1];
			if (!next) continue;
			gaps.push(next.absoluteStart - curr.absoluteStart);
		} else {
			gaps.push(totalDuration - curr.absoluteStart + firstEntry.absoluteStart);
		}
	}

	const shift = ((steps % noteCount) + noteCount) % noteCount;
	const rotatedEntries = [...entries.slice(shift), ...entries.slice(0, shift)];
	const rotatedGaps = [...gaps.slice(shift), ...gaps.slice(0, shift)];

	const beatAssignment = new Map<string, number>();
	let beat = 0;

	for (let noteIndex = 0; noteIndex < noteCount; noteIndex++) {
		const rotatedEntry = rotatedEntries[noteIndex];
		const rotatedGap = rotatedGaps[noteIndex];
		if (!rotatedEntry || rotatedGap === undefined) continue;

		beatAssignment.set(rotatedEntry.id, beat);
		beat += rotatedGap;
	}

	const transformed = mapNotes(resolved, (note, { id, absoluteOffset }) => {
		const newAbsBeat = beatAssignment.get(id);

		if (newAbsBeat !== undefined) {
			const noteDuration = note.endBeat - note.startBeat;
			return {
				...note,
				startBeat: newAbsBeat - absoluteOffset,
				endBeat: newAbsBeat - absoluteOffset + noteDuration,
			};
		}

		return note;
	});

	return new RotatePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		steps,
		input: resolved,
	});
}
