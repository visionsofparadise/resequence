import type { Unit } from "./unit";

export function walkUnits(root: Unit, callback: (unit: Unit, index: number) => void): void {
	const visited = new Set<Unit>();
	const queue: Array<Unit> = [root];
	let index = 0;

	while (queue.length > 0) {
		const unit = queue.shift();

		if (!unit) continue;
		if (visited.has(unit)) continue;
		visited.add(unit);

		callback(unit, index++);

		for (const target of unit.targets) {
			if (!visited.has(target)) queue.push(target);
		}
	}
}

export function collectUnits(root: Unit): Array<Unit> {
	const result: Array<Unit> = [];

	walkUnits(root, (unit) => { result.push(unit); });

	return result;
}

export function mapUnits(root: Unit, callback: (unit: Unit) => Unit): Unit {
	const mapping = new Map<Unit, Unit>();

	walkUnits(root, (unit) => {
		const replacement = callback(unit);

		mapping.set(unit, replacement);
	});

	for (const [original, replacement] of mapping) {
		if (replacement !== original) {
			replacement.targets.length = 0;
		}

		for (const target of original.targets) {
			const mappedTarget = mapping.get(target) ?? target;

			if (!replacement.targets.includes(mappedTarget)) {
				replacement.to(mappedTarget);
			}
		}
	}

	return mapping.get(root) ?? root;
}

export function descendUnit(root: Unit, indexes: ReadonlyArray<number>): Unit {
	let current = root;

	for (const index of indexes) {
		const target = current.targets[index];

		if (!target) throw new Error(`No target at index ${index}`);
		current = target;
	}

	return current;
}

export function computeMaxDuration(root: Unit): number {
	let max = 0;

	walkUnits(root, (unit) => {
		if (unit.duration > max) max = unit.duration;
	});

	return max;
}

export function computeMaxLatency(root: Unit): number {
	let max = 0;

	function walk(unit: Unit, cumulative: number): void {
		const total = cumulative + unit.latency;

		if (unit.targets.length === 0) {
			if (total > max) max = total;

			return;
		}

		for (const target of unit.targets) {
			walk(target, total);
		}
	}

	walk(root, 0);

	return max;
}
