import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { pitchKey } from "../pitch";
import { mapNotes } from "../utils/map";
import { walkNotes } from "../utils/walk";

export interface StrumOptions {
	readonly strumOffset?: number;
	readonly direction?: "up" | "down";
}

export interface StrumProperties extends ModifierProperties {
	readonly strumOptions: StrumOptions;
}

export class StrumPattern extends ModifierPattern<StrumProperties> {
	readonly type = ["pattern", "midi", "modifier", "strum"] as const;

	static override is(value: unknown): value is StrumPattern {
		return ModifierPattern.is(value) && value.type[3] === "strum";
	}

	clone(overrides: Partial<PatternProperties>): StrumPattern {
		return new StrumPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function strum(pattern: Pattern | Note, options: StrumOptions = {}): StrumPattern {
	const resolved = toPattern(pattern);
	const strumOffset = options.strumOffset ?? 15;
	const direction = options.direction ?? "up";
	const entries: Array<{ id: string; absoluteStart: number; key: number }> = [];

	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, key: pitchKey(note.pitch) });
	});

	const byBeat = new Map<number, typeof entries>();

	for (const entry of entries) {
		let group = byBeat.get(entry.absoluteStart);

		if (!group) {
			group = [];
			byBeat.set(entry.absoluteStart, group);
		}

		group.push(entry);
	}

	const shiftMap = new Map<string, number>();

	for (const group of byBeat.values()) {
		const sorted = direction === "up" ? group.slice().sort((ea, eb) => ea.key - eb.key) : group.slice().sort((ea, eb) => eb.key - ea.key);

		for (const [voiceIndex, entry] of sorted.entries()) {
			shiftMap.set(entry.id, voiceIndex * strumOffset);
		}
	}

	const transformed = mapNotes(resolved, (note, { id }) => {
		const shift = shiftMap.get(id);

		if (shift) {
			return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
		}

		return note;
	});

	return new StrumPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		strumOptions: options,
		input: resolved,
	});
}
