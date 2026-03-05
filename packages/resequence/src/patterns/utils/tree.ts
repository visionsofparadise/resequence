import type { Unit } from "../../units/unit";
import type { NodeContext, NoteContext, NotePath, PatternPath } from "../../utils/graph";
import { buildNodeId, extentOf, mapGraph } from "../../utils/graph";
import type { ScoreNote } from "../note";
import type { Pattern, RelativeNote } from "../pattern";

function buildNoteId(indexes: ReadonlyArray<number>, noteIndex: number): string {
	if (indexes.length === 0) return `n${noteIndex}`;
	return `${indexes.join("-")}-n${noteIndex}`;
}

export function walkPatterns(pattern: Pattern, callback: (node: Pattern, context: NodeContext) => void, parentOffset = 0, parentIndexes: ReadonlyArray<number> = []): void {
	const path: PatternPath = { patternIndexes: parentIndexes };
	const id = buildNodeId(parentIndexes);
	callback(pattern, { id, path, absoluteOffset: parentOffset });

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		walkPatterns(child, callback, parentOffset + offsetBeats, [...parentIndexes, childIndex]);
	}
}

const identityUnit = (unit: Unit): Unit => unit;

export function mapPatterns(pattern: Pattern, callback: (node: Pattern, context: NodeContext) => Pattern | undefined): Pattern {
	return mapGraph(pattern, (node, context) => callback(node, context) ?? node, identityUnit);
}

export function mapNotes(pattern: Pattern, callback: (note: ScoreNote, context: NoteContext) => ScoreNote): Pattern {
	return mapGraph(
		pattern,
		(node, context) => {
			let changed = false;
			const newNotes: Array<RelativeNote> = [];

			for (const [noteIndex, { offsetBeats, note }] of node.notes.entries()) {
				const absoluteOffset = context.absoluteOffset + offsetBeats;
				const notePath: NotePath = { patternIndexes: context.path.patternIndexes, noteIndex };
				const noteId = buildNoteId(context.path.patternIndexes, noteIndex);
				const mapped = callback(note, { id: noteId, path: notePath, absoluteOffset });

				if (mapped !== note) changed = true;

				newNotes.push({ offsetBeats, note: mapped });
			}

			if (!changed) return node;

			return node.clone({ notes: newNotes, children: node.children, ...extentOf(newNotes, node.children) });
		},
		identityUnit,
	);
}

export function flatMapNotes(pattern: Pattern, callback: (note: ScoreNote, context: NoteContext) => ReadonlyArray<ScoreNote>): Pattern {
	return mapGraph(
		pattern,
		(node, context) => {
			let changed = false;
			const expanded: Array<RelativeNote> = [];

			for (const [noteIndex, { offsetBeats, note }] of node.notes.entries()) {
				const absoluteOffset = context.absoluteOffset + offsetBeats;
				const path: NotePath = { patternIndexes: context.path.patternIndexes, noteIndex };
				const id = buildNoteId(context.path.patternIndexes, noteIndex);
				const result = callback(note, { id, path, absoluteOffset });

				if (result.length !== 1 || result[0] !== note) changed = true;

				for (const mapped of result) {
					expanded.push({ offsetBeats, note: mapped });
				}
			}

			if (!changed) return node;

			return node.clone({ notes: expanded, children: node.children, ...extentOf(expanded, node.children) });
		},
		identityUnit,
	);
}

export function mapNoteGroups(pattern: Pattern, callback: (notes: ReadonlyArray<RelativeNote>, absoluteOffset: number) => ReadonlyArray<RelativeNote>): Pattern {
	return mapGraph(
		pattern,
		(node, context) => {
			const newNotes = node.notes.length > 0 ? callback(node.notes, context.absoluteOffset) : node.notes;

			if (newNotes === node.notes) return node;

			return node.clone({ notes: newNotes, children: node.children, ...extentOf(newNotes, node.children) });
		},
		identityUnit,
	);
}

export function walkNotes(pattern: Pattern, callback: (note: ScoreNote, context: NoteContext) => void, parentOffset = 0, parentIndexes: ReadonlyArray<number> = []): void {
	walkPatterns(
		pattern,
		(node, context) => {
			for (const [noteIndex, { offsetBeats, note }] of node.notes.entries()) {
				const absoluteOffset = context.absoluteOffset + offsetBeats;
				const path: NotePath = { patternIndexes: context.path.patternIndexes, noteIndex };
				const id = buildNoteId(context.path.patternIndexes, noteIndex);
				callback(note, { id, path, absoluteOffset });
			}
		},
		parentOffset,
		parentIndexes,
	);
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
