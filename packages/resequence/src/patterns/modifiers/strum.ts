import { pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes, mapNotes } from "../utils/tree";

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
	const allNotes = collectNotes(resolved);

	const byBeat = new Map<number, Array<ScoreNote>>();
	for (const scoreNote of allNotes) {
		let group = byBeat.get(scoreNote.startBeat);
		if (!group) {
			group = [];
			byBeat.set(scoreNote.startBeat, group);
		}
		group.push(scoreNote);
	}

	const shiftMap = new Map<string, number>();

	for (const group of byBeat.values()) {
		const sorted = direction === "up"
			? group.slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch))
			: group.slice().sort((noteA, noteB) => pitchKey(noteB.pitch) - pitchKey(noteA.pitch));

		for (const [voiceIndex, scoreNote] of sorted.entries()) {
			const key = `${scoreNote.startBeat}:${scoreNote.endBeat}:${pitchKey(scoreNote.pitch)}`;
			shiftMap.set(key, voiceIndex * strumOffset);
		}
	}

	const transformed = mapNotes(resolved, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const key = `${absStart}:${absEnd}:${pitchKey(note.pitch)}`;
		const shift = shiftMap.get(key);

		if (shift) {
			return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
		}

		return note;
	});

	return new StrumPattern(pattern, options, transformed);
}
