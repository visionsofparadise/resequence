import type { Unit } from "resequence";

export function resolveUnit(unit: Unit, injectedNodes: WeakSet<object>): Unit {
	let current = unit;

	while (injectedNodes.has(current)) {
		const next = current.targets[0];

		if (!next) throw new Error("Injected unit has no target at index 0");

		current = next;
	}

	return current;
}
