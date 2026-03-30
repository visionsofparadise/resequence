import type { AnyUnit } from "./unit";

export function walkUnits(root: AnyUnit, callback: (unit: AnyUnit, parent: AnyUnit | null, index: number) => void): void {
	const visited = new Set<AnyUnit>();
	const queue: Array<{ unit: AnyUnit; parent: AnyUnit | null; index: number }> = [{ unit: root, parent: null, index: -1 }];

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

export function collectUnits(root: AnyUnit): Array<AnyUnit> {
	const result: Array<AnyUnit> = [];

	walkUnits(root, (unit) => { result.push(unit); });

	return result;
}

export function modifyUnits(root: AnyUnit, callback: (unit: AnyUnit) => AnyUnit | undefined): void {
	walkUnits(root, (unit, parent, index) => {
		const replacement = callback(unit);

		if (replacement !== undefined && parent !== null && index >= 0) {
			parent.targets[index] = replacement;
		}
	});
}

export function descendUnit(root: AnyUnit, indexes: ReadonlyArray<number>): AnyUnit {
	let current = root;

	for (const index of indexes) {
		const target = current.targets[index];

		if (!target) throw new Error(`No target at index ${index}`);
		current = target;
	}

	return current;
}

export function computeMaxDuration(root: AnyUnit): number {
	let max = 0;

	walkUnits(root, (unit) => {
		if (unit.duration > max) max = unit.duration;
	});

	return max;
}

export function computeMaxLatency(root: AnyUnit): number {
	let max = 0;

	function walk(unit: AnyUnit, cumulative: number): void {
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
