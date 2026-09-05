export function groupByBeat<E extends { absoluteStart: number }>(entries: ReadonlyArray<E>): Map<number, Array<E>> {
	const byBeat = new Map<number, Array<E>>();

	for (const entry of entries) {
		let group = byBeat.get(entry.absoluteStart);

		if (!group) {
			group = [];
			byBeat.set(entry.absoluteStart, group);
		}

		group.push(entry);
	}

	return byBeat;
}
