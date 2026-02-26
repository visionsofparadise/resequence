export function lowerBound<T>(sorted: ReadonlyArray<T>, target: number, key: (item: T) => number): number {
	let lo = 0;
	let hi = sorted.length;

	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		const item = sorted[mid];
		if (item !== undefined && key(item) < target) {
			lo = mid + 1;
		} else {
			hi = mid;
		}
	}

	return lo;
}

export function buildProcessorUrl(relativePath: string): string {
	return new URL(relativePath, import.meta.url).href;
}
