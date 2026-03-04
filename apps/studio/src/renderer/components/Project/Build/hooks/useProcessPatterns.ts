import { useMemo } from "react";
import type { Pattern, TempoMap, Unit } from "resequence";
import { gain, MidiPattern, walkPatterns } from "resequence";
import type { Arrangement } from "../utils/buildArrangement";
import { buildArrangement } from "../utils/buildArrangement";

export function useProcessPatternsA(rootPattern: Pattern): {
	readonly rootUnit: Unit;
} {
	return useMemo(() => {
		const seen = new Set<Unit>();
		const rootUnit = gain({ level: 0, id: "root" });

		walkPatterns(rootPattern, (node) => {
			if (MidiPattern.is(node)) {
				for (const unit of node.outputs) {
					if (!seen.has(unit)) {
						seen.add(unit);
						rootUnit.to(unit);
					}
				}
			}
		});

		return { rootUnit };
	}, [rootPattern]);
}

export function useProcessPatternsB(rootPattern: Pattern): {
	readonly arrangement: Arrangement;
	readonly tempoMap: TempoMap;
} {
	return useMemo(() => {
		const arrangement = buildArrangement(rootPattern);

		return { arrangement, tempoMap: arrangement.tempoMap };
	}, [rootPattern]);
}
