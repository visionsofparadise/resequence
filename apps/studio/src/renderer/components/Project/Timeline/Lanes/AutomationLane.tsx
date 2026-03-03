import { memo } from "react";
import type { AutomationLane as AutomationLaneData } from "../aggregation/types";
import { AUTOMATION_LANE_HEIGHT } from "../constants";

interface AutomationLaneProps {
	readonly lane: AutomationLaneData;
	readonly pxPerBeat: number;
	readonly segmentStartBeat: number;
}

export const AutomationLanePlaceholder = memo<AutomationLaneProps>(({ lane, pxPerBeat, segmentStartBeat }) => {
	const left = (lane.startBeat - segmentStartBeat) * pxPerBeat;
	const width = (lane.endBeat - lane.startBeat) * pxPerBeat;

	return (
		<div
			className="relative border-b border-border"
			style={{ height: AUTOMATION_LANE_HEIGHT }}
		>
			<div
				className="absolute top-0 flex items-center rounded-sm border border-muted-foreground/20 bg-muted/30 px-1.5"
				style={{ left, width, height: AUTOMATION_LANE_HEIGHT }}
			>
				<span className="truncate text-[10px] text-muted-foreground">
					{lane.name} &middot; {lane.paths.join(", ")}
				</span>
			</div>
		</div>
	);
});
