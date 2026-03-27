import type { TempoMap } from "@resequence/patterns";
import { useMemo } from "react";
import type { Router } from "resequence";
import type { Arrangement } from "../utils/buildArrangement";
import { buildArrangement } from "../utils/buildArrangement";

export function useBuildArrangement(router: Router): {
	readonly arrangement: Arrangement;
	readonly tempoMap: TempoMap;
} {
	const pattern = router.pattern;

	return useMemo(() => buildArrangement(pattern), [pattern]);
}
