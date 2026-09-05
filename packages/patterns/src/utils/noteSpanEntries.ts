import { walkPatterns } from "@resequence/patterns-core";
import type { Note, Pattern } from "@resequence/patterns-core";

export interface NoteSpanEntry {
	readonly note: Note;
	readonly absoluteStart: number;
	readonly absoluteEnd: number;
}

export function noteSpanEntriesOf(pattern: Pattern): Array<NoteSpanEntry> {
	const entries: Array<NoteSpanEntry> = [];

	walkPatterns(pattern, (node, absoluteOffset) => {
		for (const { offsetBeats, note } of node.notes) {
			const totalOffset = absoluteOffset + offsetBeats;

			entries.push({
				note,
				absoluteStart: totalOffset + note.startBeat,
				absoluteEnd: totalOffset + note.endBeat,
			});
		}
	});

	entries.sort((entryA, entryB) => entryA.absoluteStart - entryB.absoluteStart);

	return entries;
}
