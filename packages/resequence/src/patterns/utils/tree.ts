import type { ScoreNote } from "../note";
import type { Pattern, RelativeChild, RelativeNote } from "../pattern";

export interface NotePath {
	readonly indexes: ReadonlyArray<number>;
	readonly noteIndex: number;
}

export interface NoteContext {
	readonly id: string;
	readonly path: NotePath;
	readonly absoluteOffset: number;
}

export interface NodePath {
	readonly indexes: ReadonlyArray<number>;
}

export interface NodeContext {
	readonly id: string;
	readonly path: NodePath;
	readonly absoluteOffset: number;
}

function buildNodeId(indexes: ReadonlyArray<number>): string {
	if (indexes.length === 0) return "root";
	return indexes.join("-");
}

function buildNoteId(indexes: ReadonlyArray<number>, noteIndex: number): string {
	if (indexes.length === 0) return `n${noteIndex}`;
	return `${indexes.join("-")}-n${noteIndex}`;
}

function extentOf(notes: ReadonlyArray<RelativeNote>, children: ReadonlyArray<RelativeChild>): { startBeat: number; endBeat: number } {
	let startBeat = Infinity;
	let endBeat = -Infinity;

	for (const { offsetBeats, note } of notes) {
		startBeat = Math.min(startBeat, offsetBeats + note.startBeat);
		endBeat = Math.max(endBeat, offsetBeats + note.endBeat);
	}

	for (const { offsetBeats, pattern } of children) {
		startBeat = Math.min(startBeat, offsetBeats + pattern.startBeat);
		endBeat = Math.max(endBeat, offsetBeats + pattern.endBeat);
	}

	if (startBeat === Infinity) return { startBeat: 0, endBeat: 0 };
	if (endBeat === -Infinity) return { startBeat: 0, endBeat: 0 };

	return { startBeat, endBeat };
}

export function mapPatterns(
	pattern: Pattern,
	callback: (node: Pattern, context: NodeContext) => Pattern | undefined,
	parentOffset = 0,
	parentIndexes: ReadonlyArray<number> = [],
): Pattern {
	let childrenChanged = false;
	const newChildren: Array<RelativeChild> = [];

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		const mapped = mapPatterns(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);

		if (mapped !== child) childrenChanged = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	const current = childrenChanged ? pattern.clone({ notes: pattern.notes, children: newChildren, ...extentOf(pattern.notes, newChildren) }) : pattern;

	const path: NodePath = { indexes: parentIndexes };
	const id = buildNodeId(parentIndexes);
	const result = callback(current, { id, path, absoluteOffset: parentOffset });

	return result ?? current;
}

export function mapNotes(pattern: Pattern, callback: (note: ScoreNote, context: NoteContext) => ScoreNote, parentOffset = 0, parentIndexes: ReadonlyArray<number> = []): Pattern {
	return mapPatterns(
		pattern,
		(node, context) => {
			let changed = false;
			const newNotes: Array<RelativeNote> = [];

			for (const [noteIndex, { offsetBeats, note }] of node.notes.entries()) {
				const absoluteOffset = context.absoluteOffset + offsetBeats;
				const notePath: NotePath = { indexes: context.path.indexes, noteIndex };
				const noteId = buildNoteId(context.path.indexes, noteIndex);
				const mapped = callback(note, { id: noteId, path: notePath, absoluteOffset });

				if (mapped !== note) changed = true;

				newNotes.push({ offsetBeats, note: mapped });
			}

			if (!changed) return undefined;

			return node.clone({ notes: newNotes, children: node.children, ...extentOf(newNotes, node.children) });
		},
		parentOffset,
		parentIndexes,
	);
}

export function flatMapNotes(pattern: Pattern, callback: (note: ScoreNote, context: NoteContext) => ReadonlyArray<ScoreNote>, parentOffset = 0, parentIndexes: ReadonlyArray<number> = []): Pattern {
	let changed = false;
	const newChildren: Array<RelativeChild> = [];

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		const mapped = flatMapNotes(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);

		if (mapped !== child) changed = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	const expanded: Array<RelativeNote> = [];

	for (const [noteIndex, { offsetBeats, note }] of pattern.notes.entries()) {
		const absoluteOffset = parentOffset + offsetBeats;
		const path: NotePath = { indexes: parentIndexes, noteIndex };
		const id = buildNoteId(parentIndexes, noteIndex);
		const result = callback(note, { id, path, absoluteOffset });

		if (result.length !== 1 || result[0] !== note) changed = true;

		for (const mapped of result) {
			expanded.push({ offsetBeats, note: mapped });
		}
	}

	if (!changed) return pattern;

	return pattern.clone({ notes: expanded, children: newChildren, ...extentOf(expanded, newChildren) });
}

export function mapNoteGroups(pattern: Pattern, callback: (notes: ReadonlyArray<RelativeNote>, absoluteOffset: number) => ReadonlyArray<RelativeNote>, parentOffset = 0): Pattern {
	let changed = false;
	const newChildren: Array<RelativeChild> = [];

	for (const { offsetBeats, pattern: child } of pattern.children) {
		const mapped = mapNoteGroups(child, callback, parentOffset + offsetBeats);

		if (mapped !== child) changed = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	const newNotes = pattern.notes.length > 0 ? callback(pattern.notes, parentOffset) : pattern.notes;

	if (newNotes !== pattern.notes) changed = true;

	if (!changed) return pattern;

	return pattern.clone({ notes: newNotes, children: newChildren, ...extentOf(newNotes, newChildren) });
}

export function walkNotes(pattern: Pattern, callback: (note: ScoreNote, context: NoteContext) => void, parentOffset = 0, parentIndexes: ReadonlyArray<number> = []): void {
	for (const [noteIndex, { offsetBeats, note }] of pattern.notes.entries()) {
		const absoluteOffset = parentOffset + offsetBeats;
		const path: NotePath = { indexes: parentIndexes, noteIndex };
		const id = buildNoteId(parentIndexes, noteIndex);
		callback(note, { id, path, absoluteOffset });
	}

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		walkNotes(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);
	}
}

export function walkPatterns(pattern: Pattern, callback: (node: Pattern, context: NodeContext) => void, parentOffset = 0, parentIndexes: ReadonlyArray<number> = []): void {
	const path: NodePath = { indexes: parentIndexes };
	const id = buildNodeId(parentIndexes);
	callback(pattern, { id, path, absoluteOffset: parentOffset });

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		walkPatterns(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);
	}
}

export function descendAndClone(pattern: Pattern, indexes: ReadonlyArray<number>, operation: (node: Pattern) => Pattern): Pattern {
	if (indexes.length === 0) return operation(pattern);

	const targetIndex = indexes[0];
	if (targetIndex === undefined) return pattern;
	const rest = indexes.slice(1);
	const child = pattern.children[targetIndex];

	if (!child) throw new Error(`Child index ${targetIndex} out of bounds (pattern has ${pattern.children.length} children)`);

	const modifiedChild = descendAndClone(child.pattern, rest, operation);
	const newChildren: Array<RelativeChild> = pattern.children.map((entry, position) => (position === targetIndex ? { offsetBeats: entry.offsetBeats, pattern: modifiedChild } : entry));

	return pattern.clone({ notes: pattern.notes, children: newChildren, ...extentOf(pattern.notes, newChildren) });
}

export function collectNotes(pattern: Pattern, offsetBeats = 0): Array<ScoreNote> {
	const results: Array<ScoreNote> = [];

	walkPatterns(
		pattern,
		(node, { absoluteOffset }) => {
			for (const { offsetBeats: noteOffset, note } of node.notes) {
				const totalOffset = absoluteOffset + noteOffset;

				results.push({ ...note, startBeat: note.startBeat + totalOffset, endBeat: note.endBeat + totalOffset });
			}
		},
		offsetBeats,
	);

	return results;
}
