import { CompositeUnit } from "@resequence/web-au-core";
import type { AnyUnit } from "@resequence/web-au-core";

export function detachTargets(unit: AnyUnit): Array<AnyUnit> {
	const targets: Array<AnyUnit> = [...unit.targets];

	unit.targets.length = 0;

	if (unit instanceof CompositeUnit) {
		const tail = "tail" in unit ? (unit as { tail: AnyUnit }).tail : undefined;

		if (tail) {
			for (const target of tail.targets) {
				if (!targets.includes(target)) targets.push(target);
			}

			tail.targets.length = 0;
		}
	}

	return targets;
}
