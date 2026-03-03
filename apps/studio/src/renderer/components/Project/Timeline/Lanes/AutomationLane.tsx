import { memo } from "react";
import type { AutomationLane as AutomationLaneData } from "../aggregation/types";
import { AUTOMATION_LANE_HEIGHT } from "../constants";
import { AutomationCanvas } from "./AutomationCanvas";

interface AutomationLaneProps {
	readonly lane: AutomationLaneData;
	readonly pxPerBeat: number;
	readonly segmentStartBeat: number;
}

export const AutomationLane = memo<AutomationLaneProps>(({ lane, pxPerBeat, segmentStartBeat }) => {
	const left = (lane.startBeat - segmentStartBeat) * pxPerBeat;
	const width = (lane.endBeat - lane.startBeat) * pxPerBeat;

	return (
		<div
			className="relative border-b border-border"
			style={{ height: AUTOMATION_LANE_HEIGHT }}
		>
			<div
				className="absolute top-0 overflow-hidden"
				style={{ left, width, height: AUTOMATION_LANE_HEIGHT }}
			>
				<AutomationCanvas
					source={lane.source}
					width={width}
					height={AUTOMATION_LANE_HEIGHT}
					startBeat={lane.startBeat}
					endBeat={lane.endBeat}
					pxPerBeat={pxPerBeat}
				/>
				<span className="pointer-events-none absolute left-1 top-0.5 rounded-sm bg-background/60 px-1 text-[10px] text-muted-foreground">
					{lane.name} &middot; {lane.paths.join(", ")}
				</span>
			</div>
		</div>
	);
});
