export function filterNames(names: ReadonlyArray<string>, include?: ReadonlyArray<string>, exclude?: ReadonlyArray<string>): ReadonlyArray<string> {
	let filtered = [...names];

	if (include && include.length > 0) {
		const includeSet = new Set(include);

		filtered = filtered.filter((name) => includeSet.has(name));
	}

	if (exclude && exclude.length > 0) {
		const excludeSet = new Set(exclude);

		filtered = filtered.filter((name) => !excludeSet.has(name));
	}

	return filtered;
}
