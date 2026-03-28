import type { Unit } from "./unit";

export function walkUnits(root: Unit, callback: (unit: Unit, parent: Unit | null, index: number) => void): void {
	const visited = new Set<Unit>();
	const queue: Array<{ unit: Unit; parent: Unit | null; index: number }> = [{ unit: root, parent: null, index: -1 }];

	while (queue.length > 0) {
		const entry = queue.shift();

		if (!entry) continue;
		if (visited.has(entry.unit)) continue;
		visited.add(entry.unit);

		callback(entry.unit, entry.parent, entry.index);

		for (let ix = 0; ix < entry.unit.targets.length; ix++) {
			const target = entry.unit.targets[ix];

			if (target && !visited.has(target)) queue.push({ unit: target, parent: entry.unit, index: ix });
		}
	}
}

export function collectUnits(root: Unit): Array<Unit> {
	const result: Array<Unit> = [];

	walkUnits(root, (unit) => { result.push(unit); });

	return result;
}

export function modifyUnits(root: Unit, callback: (unit: Unit) => Unit | undefined): void {
	walkUnits(root, (unit, parent, index) => {
		const replacement = callback(unit);

		if (replacement !== undefined && parent !== null && index >= 0) {
			parent.targets[index] = replacement;
		}
	});
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
