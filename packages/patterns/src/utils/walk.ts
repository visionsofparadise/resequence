import type { Note } from "../note";
import type { Pattern } from "../patterns/pattern";

export interface NoteContext {
	readonly id: string;
	readonly absoluteOffset: number;
}

function buildNoteId(indexes: ReadonlyArray<number>, noteIndex: number): string {
	if (indexes.length === 0) return `n${noteIndex}`;

	return `${indexes.join("-")}-n${noteIndex}`;
}

export function walkPatterns(pattern: Pattern, callback: (pattern: Pattern, absoluteBeat: number) => void, parentOffset = 0): void {
	callback(pattern, parentOffset);

	for (const { offsetBeats, pattern: child } of pattern.children) {
		walkPatterns(child, callback, parentOffset + offsetBeats);
	}
}

export function walkNotes(pattern: Pattern, callback: (note: Note, context: NoteContext) => void, parentOffset = 0, parentIndexes: ReadonlyArray<number> = []): void {
	for (const [noteIndex, { offsetBeats, note }] of pattern.notes.entries()) {
		const id = buildNoteId(parentIndexes, noteIndex);

		callback(note, { id, absoluteOffset: parentOffset + offsetBeats });
	}

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		walkNotes(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);
	}
}

export function collectNotes(pattern: Pattern, parentOffset = 0): Array<{ note: Note; absoluteBeat: number }> {
	const results: Array<{ note: Note; absoluteBeat: number }> = [];

	walkNotes(
		pattern,
		(note, { absoluteOffset }) => {
			results.push({ note, absoluteBeat: absoluteOffset });
		},
		parentOffset,
	);

	return results;
}
