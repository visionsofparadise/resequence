import { useMemo } from "react";
import type { Unit } from "resequence";
import type { BuildContext } from "../../../../../models/Context";

export function useOutputs(context: BuildContext): ReadonlyArray<Unit> {
	const { outputs } = context;

	return useMemo(() => outputs.map((entry) => entry.unit), [outputs]);
}
