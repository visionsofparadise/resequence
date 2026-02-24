import type { PositionedNote } from "../patterns/pattern";

export function groupByOutput(notes: ReadonlyArray<PositionedNote>): Map<string, Array<PositionedNote>> {
	const groups = new Map<string, Array<PositionedNote>>();

	for (const positionedNote of notes) {
		const key = positionedNote.trackName ?? "";
		let group = groups.get(key);

		if (!group) {
			group = [];
			groups.set(key, group);
		}

		group.push(positionedNote);
	}

	return groups;
}
