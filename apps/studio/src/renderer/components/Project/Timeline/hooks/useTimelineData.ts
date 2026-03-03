import { useMemo } from "react";
import type { ProjectContext } from "../../../../models/Context";
import { aggregateTree } from "../aggregation/aggregateTree";
import type { TimelineData } from "../aggregation/types";

export function useTimelineData(context: ProjectContext): TimelineData | null {
	const { build } = context;
	return useMemo(() => (build.tree ? aggregateTree(build.tree) : null), [build.tree]);
}
