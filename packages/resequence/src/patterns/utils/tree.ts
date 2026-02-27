import { Pattern } from "../pattern";

export interface PatternNode {
	readonly pattern: Pattern;
	readonly offsetBeats: number;
}

export function childrenOf(pattern: Pattern, offsetBeats: number): ReadonlyArray<PatternNode> {
	if (pattern.type === "sequence" && "children" in pattern) {
		const children = (pattern as { children: ReadonlyArray<Pattern> }).children;
		const result: Array<PatternNode> = [];
		let cursor = offsetBeats;
		for (const child of children) {
			result.push({ pattern: child, offsetBeats: cursor });
			cursor += child.durationBeats;
		}
		return result;
	}

	if (pattern.type === "repeat" && "child" in pattern && "count" in pattern) {
		const rp = pattern as unknown as { child: Pattern; count: number };
		const result: Array<PatternNode> = [];
		for (let iteration = 0; iteration < rp.count; iteration++) {
			result.push({ pattern: rp.child, offsetBeats: offsetBeats + rp.child.durationBeats * iteration });
		}
		return result;
	}

	if ("child" in pattern) {
		const child = (pattern as { child: unknown }).child;
		if (child instanceof Pattern) return [{ pattern: child, offsetBeats }];
	}

	if ("children" in pattern) {
		const children = (pattern as { children: unknown }).children;
		if (Array.isArray(children)) {
			return children.filter((ch): ch is Pattern => ch instanceof Pattern).map((ch) => ({ pattern: ch, offsetBeats }));
		}
	}

	return [];
}

export function flatMapTree<T>(pattern: Pattern, visitor: (pattern: Pattern, offsetBeats: number) => ReadonlyArray<T>): Array<T> {
	return walk(pattern, 0, visitor);
}

function walk<T>(pattern: Pattern, offsetBeats: number, visitor: (pattern: Pattern, offsetBeats: number) => ReadonlyArray<T>): Array<T> {
	const results: Array<T> = [...visitor(pattern, offsetBeats)];
	for (const child of childrenOf(pattern, offsetBeats)) {
		results.push(...walk(child.pattern, child.offsetBeats, visitor));
	}
	return results;
}
