export function filterPorts(
	keys: ReadonlyArray<string>,
	include?: ReadonlyArray<string>,
	exclude?: ReadonlyArray<string>,
): ReadonlyArray<string> {
	let filtered = [...keys];

	if (include && include.length > 0) {
		const set = new Set(include);

		filtered = filtered.filter((key) => set.has(key));
	}

	if (exclude && exclude.length > 0) {
		const set = new Set(exclude);

		filtered = filtered.filter((key) => !set.has(key));
	}

	return filtered;
}
