import { walkNotes } from "@resequence/patterns-core";
import type { Pattern } from "@resequence/patterns-core";

export interface NoteStartEntry {
	readonly id: string;
	readonly absoluteStart: number;
}

export function noteStartEntriesOf(pattern: Pattern): Array<NoteStartEntry> {
	const entries: Array<NoteStartEntry> = [];

	walkNotes(pattern, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat });
	});
	entries.sort((entryA, entryB) => entryA.absoluteStart - entryB.absoluteStart);

	return entries;
}
