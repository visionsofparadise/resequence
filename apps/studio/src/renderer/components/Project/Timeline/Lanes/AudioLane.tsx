import { memo } from "react";
import type { AudioLane as AudioLaneData } from "../aggregation/types";
import { AUDIO_LANE_HEIGHT } from "../constants";

interface AudioLaneProps {
	readonly lane: AudioLaneData;
	readonly pxPerBeat: number;
	readonly segmentStartBeat: number;
}

export const AudioLanePlaceholder = memo<AudioLaneProps>(({ lane, pxPerBeat, segmentStartBeat }) => {
	const left = (lane.startBeat - segmentStartBeat) * pxPerBeat;
	const width = (lane.endBeat - lane.startBeat) * pxPerBeat;

	return (
		<div
			className="relative border-b border-border"
			style={{ height: AUDIO_LANE_HEIGHT }}
		>
			<div
				className="absolute top-0 flex items-center rounded-sm border border-muted-foreground/30 bg-muted/50 px-1.5"
				style={{ left, width, height: AUDIO_LANE_HEIGHT }}
			>
				<span className="truncate text-[10px] text-muted-foreground">{lane.name}</span>
			</div>
		</div>
	);
});
