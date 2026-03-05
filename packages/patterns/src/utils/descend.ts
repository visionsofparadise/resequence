import type { Pattern, RelativeChild } from "../patterns/pattern";
import { extentOf } from "./extent";

export function descendAndClone(pattern: Pattern, indexes: ReadonlyArray<number>, operation: (target: Pattern) => Pattern): Pattern {
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
