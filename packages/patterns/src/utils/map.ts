import type { Note } from "../note";
import type { Pattern, RelativeChild, RelativeNote } from "../patterns/pattern";
import { extentOf } from "./extent";

export function mapPatterns(pattern: Pattern, callback: (pattern: Pattern, absoluteBeat: number) => Pattern, parentOffset = 0): Pattern {
	let childrenChanged = false;
	const newChildren: Array<RelativeChild> = [];

	for (const { offsetBeats, pattern: child } of pattern.children) {
		const mapped = mapPatterns(child, callback, parentOffset + offsetBeats);

		if (mapped !== child) childrenChanged = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	let current = pattern;

	if (childrenChanged) {
		current = pattern.clone({ notes: pattern.notes, children: newChildren, ...extentOf(pattern.notes, newChildren) });
	}

	return callback(current, parentOffset);
}

export function mapNotes(pattern: Pattern, callback: (note: Note, absoluteBeat: number) => Note, parentOffset = 0): Pattern {
	return mapPatterns(
		pattern,
		(node, absoluteOffset) => {
			let changed = false;

			const newNotes: Array<RelativeNote> = [];

			for (const { offsetBeats, note } of node.notes) {
				const mapped = callback(note, absoluteOffset + offsetBeats);

				if (mapped !== note) changed = true;

				newNotes.push({ offsetBeats, note: mapped });
			}

			if (!changed) return node;

			return node.clone({ notes: newNotes, children: node.children, ...extentOf(newNotes, node.children) });
		},
		parentOffset,
	);
}

export function flatMapNotes(pattern: Pattern, callback: (note: Note, absoluteBeat: number) => ReadonlyArray<Note>, parentOffset = 0): Pattern {
	return mapPatterns(
		pattern,
		(node, absoluteOffset) => {
			let changed = false;

			const expanded: Array<RelativeNote> = [];

			for (const { offsetBeats, note } of node.notes) {
				const result = callback(note, absoluteOffset + offsetBeats);

				if (result.length !== 1 || result[0] !== note) changed = true;

				for (const mapped of result) {
					expanded.push({ offsetBeats, note: mapped });
				}
			}

			if (!changed) return node;

			return node.clone({ notes: expanded, children: node.children, ...extentOf(expanded, node.children) });
		},
		parentOffset,
	);
}
