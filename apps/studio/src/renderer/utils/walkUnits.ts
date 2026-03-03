import type { Unit } from "resequence";
import type { UnitRoot } from "../models/State/Build";

export function walkUnits(
	unitRoot: UnitRoot,
	visitor: (unit: Unit, index: number) => void,
	visited = new WeakSet<Unit>(),
): void {
	for (let index = 0; index < unitRoot.children.length; index++) {
		const unit = unitRoot.children[index];
		if (!unit || visited.has(unit)) continue;
		visited.add(unit);
		visitor(unit, index);
		walkUnitTargets(unit, visitor, visited);
	}
}

function walkUnitTargets(
	unit: Unit,
	visitor: (unit: Unit, index: number) => void,
	visited: WeakSet<Unit>,
): void {
	for (let index = 0; index < unit.targets.length; index++) {
		const target = unit.targets[index];
		if (!target || visited.has(target)) continue;
		visited.add(target);
		visitor(target, index);
		walkUnitTargets(target, visitor, visited);
	}
}
