import type { Unit } from "resequence";

export function walkUnits(
	unit: Unit,
	visitor: (unit: Unit, index: number) => void,
	visited = new WeakSet<Unit>(),
): void {
	for (let index = 0; index < unit.targets.length; index++) {
		const target = unit.targets[index];
		if (!target || visited.has(target)) continue;
		visited.add(target);
		visitor(target, index);
		walkUnits(target, visitor, visited);
	}
}
