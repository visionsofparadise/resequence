import type { ScoreNote } from "../note";
import type { Pattern, RelativeChild, RelativeNote } from "../pattern";

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

export function mapNotes(pattern: Pattern, callback: (note: ScoreNote, absoluteOffset: number) => ScoreNote, parentOffset = 0): Pattern {
	let changed = false;
	const newChildren: Array<RelativeChild> = [];

	for (const { offsetBeats, pattern: child } of pattern.children) {
		const mapped = mapNotes(child, callback, parentOffset + offsetBeats);

		if (mapped !== child) changed = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	const newNotes: Array<RelativeNote> = [];

	for (const { offsetBeats, note } of pattern.notes) {
		const mapped = callback(note, parentOffset + offsetBeats);

		if (mapped !== note) changed = true;

		newNotes.push({ offsetBeats, note: mapped });
	}

	if (!changed) return pattern;

	return pattern.clone({ notes: newNotes, children: newChildren, ...extentOf(newNotes, newChildren) });
}

export function flatMapNotes(pattern: Pattern, callback: (note: ScoreNote, absoluteOffset: number) => ReadonlyArray<ScoreNote>, parentOffset = 0): Pattern {
	let changed = false;
	const newChildren: Array<RelativeChild> = [];

	for (const { offsetBeats, pattern: child } of pattern.children) {
		const mapped = flatMapNotes(child, callback, parentOffset + offsetBeats);

		if (mapped !== child) changed = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	const expanded: Array<RelativeNote> = [];

	for (const { offsetBeats, note } of pattern.notes) {
		const result = callback(note, parentOffset + offsetBeats);

		if (result.length !== 1 || result[0] !== note) changed = true;

		for (const mapped of result) {
			expanded.push({ offsetBeats, note: mapped });
		}
	}

	if (!changed) return pattern;

	return pattern.clone({ notes: expanded, children: newChildren, ...extentOf(expanded, newChildren) });
}

export function mapGroups(pattern: Pattern, callback: (notes: ReadonlyArray<RelativeNote>, absoluteOffset: number) => ReadonlyArray<RelativeNote>, parentOffset = 0): Pattern {
	let changed = false;
	const newChildren: Array<RelativeChild> = [];

	for (const { offsetBeats, pattern: child } of pattern.children) {
		const mapped = mapGroups(child, callback, parentOffset + offsetBeats);

		if (mapped !== child) changed = true;

		newChildren.push({ offsetBeats, pattern: mapped });
	}

	const newNotes = pattern.notes.length > 0 ? callback(pattern.notes, parentOffset) : pattern.notes;

	if (newNotes !== pattern.notes) changed = true;

	if (!changed) return pattern;

	return pattern.clone({ notes: newNotes, children: newChildren, ...extentOf(newNotes, newChildren) });
}

export function walkNodes(pattern: Pattern, callback: (node: Pattern, absoluteOffset: number) => void, parentOffset = 0): void {
	callback(pattern, parentOffset);

	for (const { offsetBeats, pattern: child } of pattern.children) {
		walkNodes(child, callback, parentOffset + offsetBeats);
	}
}

export function collectNotes(pattern: Pattern, offsetBeats = 0): Array<ScoreNote> {
	const results: Array<ScoreNote> = [];

	walkNodes(pattern, (node, absoluteOffset) => {
		for (const { offsetBeats: noteOffset, note } of node.notes) {
			const totalOffset = absoluteOffset + noteOffset;

			results.push({ ...note, startBeat: note.startBeat + totalOffset, endBeat: note.endBeat + totalOffset });
		}
	}, offsetBeats);

	return results;
}
