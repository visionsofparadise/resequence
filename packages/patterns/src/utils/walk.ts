import type { Note } from "../note";
import type { Pattern } from "../patterns/pattern";

export function walkPatterns(pattern: Pattern, callback: (pattern: Pattern, absoluteBeat: number) => void, parentOffset = 0): void {
	callback(pattern, parentOffset);

	for (const { offsetBeats, pattern: child } of pattern.children) {
		walkPatterns(child, callback, parentOffset + offsetBeats);
	}
}

export function walkNotes(pattern: Pattern, callback: (note: Note, absoluteBeat: number) => void, parentOffset = 0): void {
	walkPatterns(
		pattern,
		(node, absoluteOffset) => {
			for (const { offsetBeats, note } of node.notes) {
				callback(note, absoluteOffset + offsetBeats);
			}
		},
		parentOffset,
	);
}

export function collectNotes(pattern: Pattern, parentOffset = 0): Array<{ note: Note; absoluteBeat: number }> {
	const results: Array<{ note: Note; absoluteBeat: number }> = [];

	walkNotes(
		pattern,
		(note, absoluteBeat) => {
			results.push({ note, absoluteBeat });
		},
		parentOffset,
	);

	return results;
}
