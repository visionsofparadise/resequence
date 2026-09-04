import { useMemo } from "react";
import { buildArrangement } from "../utils/buildArrangement";
import type { Arrangement } from "../utils/buildArrangement";
import type { Router, TempoMap } from "resequence";

export function useBuildArrangement(router: Router): {
	readonly arrangement: Arrangement;
	readonly tempoMap: TempoMap;
} {
	const pattern = router.pattern;

	return useMemo(() => buildArrangement(pattern), [pattern]);
}
