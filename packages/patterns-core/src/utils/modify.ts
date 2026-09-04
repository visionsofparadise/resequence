import { extentOf } from "./extent";
import type { Note } from "../note";
import type { NoteContext } from "./walk";
import type { Pattern, RelativeNote } from "../patterns/pattern";

function buildNoteId(indexes: ReadonlyArray<number>, noteIndex: number): string {
	if (indexes.length === 0) return `n${noteIndex}`;

	return `${indexes.join("-")}-n${noteIndex}`;
}

export function modifyPatterns(
	pattern: Pattern,
	callback: (pattern: Pattern, absoluteBeat: number) => void,
	parentOffset = 0,
): void {
	for (const { offsetBeats, pattern: child } of pattern.children) {
		modifyPatterns(child, callback, parentOffset + offsetBeats);
	}

	const { startBeat, endBeat } = extentOf(pattern.properties.notes, pattern.properties.children);

	pattern.properties.startBeat = startBeat;
	pattern.properties.endBeat = endBeat;

	callback(pattern, parentOffset);
}

function modifyNotesInternal(
	pattern: Pattern,
	callback: (note: Note, context: NoteContext) => Note,
	parentOffset: number,
	parentIndexes: ReadonlyArray<number>,
): void {
	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		modifyNotesInternal(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);
	}

	const newNotes: Array<RelativeNote> = [];

	for (const [noteIndex, { offsetBeats, note }] of pattern.notes.entries()) {
		const id = buildNoteId(parentIndexes, noteIndex);
		const mapped = callback(note, { id, absoluteOffset: parentOffset + offsetBeats });

		newNotes.push({ offsetBeats, note: mapped });
	}

	pattern.properties.notes = newNotes;

	const { startBeat, endBeat } = extentOf(pattern.properties.notes, pattern.properties.children);

	pattern.properties.startBeat = startBeat;
	pattern.properties.endBeat = endBeat;
}

export function modifyNotes(
	pattern: Pattern,
	callback: (note: Note, context: NoteContext) => Note,
	parentOffset = 0,
): void {
	modifyNotesInternal(pattern, callback, parentOffset, []);
}

function flatModifyNotesInternal(
	pattern: Pattern,
	callback: (note: Note, context: NoteContext) => ReadonlyArray<Note>,
	parentOffset: number,
	parentIndexes: ReadonlyArray<number>,
): void {
	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		flatModifyNotesInternal(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);
	}

	const expanded: Array<RelativeNote> = [];

	for (const [noteIndex, { offsetBeats, note }] of pattern.notes.entries()) {
		const id = buildNoteId(parentIndexes, noteIndex);
		const result = callback(note, { id, absoluteOffset: parentOffset + offsetBeats });

		for (const mapped of result) {
			expanded.push({ offsetBeats, note: mapped });
		}
	}

	pattern.properties.notes = expanded;

	const { startBeat, endBeat } = extentOf(pattern.properties.notes, pattern.properties.children);

	pattern.properties.startBeat = startBeat;
	pattern.properties.endBeat = endBeat;
}

export function flatModifyNotes(
	pattern: Pattern,
	callback: (note: Note, context: NoteContext) => ReadonlyArray<Note>,
	parentOffset = 0,
): void {
	flatModifyNotesInternal(pattern, callback, parentOffset, []);
}
