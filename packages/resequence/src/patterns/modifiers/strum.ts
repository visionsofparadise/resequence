import { pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes, walkNotes } from "../utils/tree";

export interface StrumOptions {
	readonly strumOffset?: number;
	readonly direction?: "up" | "down";
}

export class StrumPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly strumOptions: StrumOptions,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): StrumPattern {
		return new StrumPattern(this.source, this.strumOptions, this.overrideNode(overrides));
	}
}

export function strum(pattern: Pattern | ScoreNote, options: StrumOptions = {}): StrumPattern {
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
		const sorted = direction === "up"
			? group.slice().sort((ea, eb) => ea.key - eb.key)
			: group.slice().sort((ea, eb) => eb.key - ea.key);

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

	return new StrumPattern(pattern, options, transformed);
}
