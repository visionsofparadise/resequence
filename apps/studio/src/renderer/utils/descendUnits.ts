import type { Unit } from "resequence";
import { resolveUnit } from "./resolveUnit";

// FIX: A descent needs to take an array of indexes, not just 1 step
export function descendUnits(root: Unit, index: number, injectedNodes?: WeakSet<object>): Unit | undefined {
	const target = root.targets[index];

	if (!target) return undefined;

	if (injectedNodes) return resolveUnit(target, injectedNodes);

	return target;
}
