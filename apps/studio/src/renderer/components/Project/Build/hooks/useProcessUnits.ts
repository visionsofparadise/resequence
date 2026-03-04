import { useEffect } from "react";
import type { Unit } from "resequence";
import { mapUnits } from "resequence";

export function useProcessUnits(rootUnit: Unit): void {
	useEffect(() => {
		mapUnits(rootUnit, (current, location) => {
			if (current.id) return undefined;

			return current.clone({ id: `_${location.indexes.join("-")}` });
		});
	}, [rootUnit]);
}
