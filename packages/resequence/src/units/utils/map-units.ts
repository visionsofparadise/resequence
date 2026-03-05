import type { Unit } from "../unit";

export interface UnitContext {
	readonly indexes: ReadonlyArray<number>;
}

export function mapUnits(root: Unit, mapper: (unit: Unit, context: UnitContext) => Unit, parentIndexes: ReadonlyArray<number> = [], visited?: Map<Unit, Unit>): Unit {
	visited ??= new Map();

	const cached = visited.get(root);

	if (cached !== undefined) return cached;

	const context: UnitContext = { indexes: parentIndexes };
	const mapped = mapper(root, context);
	const newTargets = root.targets.map((target, index) => mapUnits(target, mapper, [...parentIndexes, index], visited));
	const targetsChanged = newTargets.some((target, index) => target !== root.targets[index]);

	if (mapped === root && !targetsChanged) {
		visited.set(root, root);

		return root;
	}

	const result = targetsChanged ? mapped.clone({ targets: newTargets }) : mapped;

	visited.set(root, result);

	return result;
}
