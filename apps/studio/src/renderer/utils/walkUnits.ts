import type { Unit } from "@resequence/web-au/core";
import { resolveUnit } from "./resolveUnit";

export function walkUnits(unit: Unit, visitor: (unit: Unit, parent: Unit | null, index: number) => void, visited = new WeakSet<Unit>(), injectedNodes?: WeakSet<object>): void {
	for (let index = 0; index < unit.targets.length; index++) {
		let target = unit.targets[index];

		if (!target) continue;
		if (injectedNodes) target = resolveUnit(target, injectedNodes);
		if (visited.has(target)) continue;

		visited.add(target);
		visitor(target, unit, index);

		walkUnits(target, visitor, visited, injectedNodes);
	}
}
