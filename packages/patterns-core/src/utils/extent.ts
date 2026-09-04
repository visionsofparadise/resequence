import type { RelativeChild, RelativeNote } from "../patterns/pattern";

export function extentOf(
	notes: ReadonlyArray<RelativeNote>,
	children: ReadonlyArray<RelativeChild>,
): { startBeat: number; endBeat: number } {
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
