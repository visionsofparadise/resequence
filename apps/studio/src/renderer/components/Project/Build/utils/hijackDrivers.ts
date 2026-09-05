import { StudioDriver } from "../models/StudioDriver";
import type { ValueScheduler } from "../models/ValueScheduler";
import type { DriverEntry } from "@resequence/web-au/core";

export interface DerivedDriverMap {
	readonly byUnit: Map<string, Map<string, StudioDriver>>;
	readonly all: Map<string, StudioDriver>;
}

export function hijackDrivers(
	driverMap: ReadonlyMap<string, DriverEntry>,
	scheduler: ValueScheduler,
): DerivedDriverMap {
	const all = new Map<string, StudioDriver>();
	const byUnit = new Map<string, Map<string, StudioDriver>>();

	for (const [path, entry] of driverMap) {
		const studioDriver = new StudioDriver(entry.node, entry.range, scheduler);

		(driverMap as Map<string, DriverEntry>).set(path, { node: studioDriver, range: entry.range });

		all.set(path, studioDriver);

		const dotIndex = path.indexOf(".");

		if (dotIndex !== -1) {
			const unitId = path.slice(0, dotIndex);
			const paramName = path.slice(dotIndex + 1);

			let unitMap = byUnit.get(unitId);

			if (!unitMap) {
				unitMap = new Map();
				byUnit.set(unitId, unitMap);
			}

			unitMap.set(paramName, studioDriver);
		}
	}

	return { byUnit, all };
}
