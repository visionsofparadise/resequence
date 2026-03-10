import type { TempoMap } from "@resequence/patterns";
import { useMemo } from "react";
import type { PatternSource } from "resequence";
import type { Arrangement } from "../utils/buildArrangement";
import { buildArrangement } from "../utils/buildArrangement";

export function useBuildArrangement(source: PatternSource): {
	readonly arrangement: Arrangement;
	readonly tempoMap: TempoMap;
} {
	const pattern = source.pattern;

	return useMemo(() => buildArrangement(pattern), [pattern]);
}
