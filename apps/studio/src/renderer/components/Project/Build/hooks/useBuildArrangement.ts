import { useMemo } from "react";
import type { Pattern, TempoMap } from "resequence";
import type { Arrangement } from "../utils/buildArrangement";
import { buildArrangement } from "../utils/buildArrangement";

export function useBuildArrangement(rootPattern: Pattern): {
	readonly arrangement: Arrangement;
	readonly tempoMap: TempoMap;
} {
	return useMemo(() => buildArrangement(rootPattern), [rootPattern]);
}
