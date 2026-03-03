import type { Unit } from "../unit";

export interface UnitContext {
	readonly indexes: ReadonlyArray<number>;
}

export function mapUnits(
	root: Unit,
	mapper: (unit: Unit, context: UnitContext) => Unit | undefined,
	parentIndexes: ReadonlyArray<number> = [],
	visited?: Map<Unit, Unit>,
): Unit {
	visited ??= new Map();
	const cached = visited.get(root);
	if (cached !== undefined) return cached;

	const context: UnitContext = { indexes: parentIndexes };
	const replacement = mapper(root, context);
	const newTargets = root.targets.map((target, index) =>
		mapUnits(target, mapper, [...parentIndexes, index], visited),
	);
	const targetsChanged = newTargets.some((target, index) => target !== root.targets[index]);

	if (!replacement && !targetsChanged) {
		visited.set(root, root);
		return root;
	}

	const result = (replacement ?? root).clone({
		targets: targetsChanged ? newTargets : undefined,
	});
	visited.set(root, result);
	return result;
}
