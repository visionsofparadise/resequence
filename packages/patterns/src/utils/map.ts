import type { Note } from "../note";
import type { Pattern, RelativeChild, RelativeNote } from "../patterns/pattern";
import { extentOf } from "./extent";
import type { NoteContext } from "./walk";

function buildNoteId(indexes: ReadonlyArray<number>, noteIndex: number): string {
	if (indexes.length === 0) return `n${noteIndex}`;
	return `${indexes.join("-")}-n${noteIndex}`;
}

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

function mapNotesInternal(pattern: Pattern, callback: (note: Note, context: NoteContext) => Note, parentOffset: number, parentIndexes: ReadonlyArray<number>): Pattern {
	let childrenChanged = false;
	const newChildren: Array<RelativeChild> = [];

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		const mapped = mapNotesInternal(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);

		if (mapped !== child) childrenChanged = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	let changed = false;
	const newNotes: Array<RelativeNote> = [];

	for (const [noteIndex, { offsetBeats, note }] of pattern.notes.entries()) {
		const id = buildNoteId(parentIndexes, noteIndex);
		const mapped = callback(note, { id, absoluteOffset: parentOffset + offsetBeats });

		if (mapped !== note) changed = true;

		newNotes.push({ offsetBeats, note: mapped });
	}

	if (!changed && !childrenChanged) return pattern;

	const notes = changed ? newNotes : pattern.notes;
	const children = childrenChanged ? newChildren : pattern.children;

	return pattern.clone({ notes, children, ...extentOf(notes, children) });
}

export function mapNotes(pattern: Pattern, callback: (note: Note, context: NoteContext) => Note, parentOffset = 0): Pattern {
	return mapNotesInternal(pattern, callback, parentOffset, []);
}

function flatMapNotesInternal(pattern: Pattern, callback: (note: Note, context: NoteContext) => ReadonlyArray<Note>, parentOffset: number, parentIndexes: ReadonlyArray<number>): Pattern {
	let childrenChanged = false;
	const newChildren: Array<RelativeChild> = [];

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		const mapped = flatMapNotesInternal(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);

		if (mapped !== child) childrenChanged = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	let changed = false;
	const expanded: Array<RelativeNote> = [];

	for (const [noteIndex, { offsetBeats, note }] of pattern.notes.entries()) {
		const id = buildNoteId(parentIndexes, noteIndex);
		const result = callback(note, { id, absoluteOffset: parentOffset + offsetBeats });

		if (result.length !== 1 || result[0] !== note) changed = true;

		for (const mapped of result) {
			expanded.push({ offsetBeats, note: mapped });
		}
	}

	if (!changed && !childrenChanged) return pattern;

	const notes = changed ? expanded : pattern.notes;
	const children = childrenChanged ? newChildren : pattern.children;

	return pattern.clone({ notes, children, ...extentOf(notes, children) });
}

export function flatMapNotes(pattern: Pattern, callback: (note: Note, context: NoteContext) => ReadonlyArray<Note>, parentOffset = 0): Pattern {
	return flatMapNotesInternal(pattern, callback, parentOffset, []);
}
