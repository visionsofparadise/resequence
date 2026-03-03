import { memo } from "react";
import type { TimelineSegment } from "./aggregation/types";
import { AudioLanePlaceholder } from "./Lanes/AudioLane";
import { AutomationLanePlaceholder } from "./Lanes/AutomationLane";
import { NoteLanePlaceholder } from "./Lanes/NoteLane";

interface SegmentProps {
	readonly segment: TimelineSegment;
	readonly pxPerBeat: number;
	readonly hoveredPattern: string | null;
	readonly onHoverPattern: (path: string | null) => void;
}

export const SegmentComponent = memo<SegmentProps>(({ segment, pxPerBeat, hoveredPattern, onHoverPattern }) => {
	const left = segment.startBeat * pxPerBeat;
	const width = (segment.endBeat - segment.startBeat) * pxPerBeat;

	return (
		<div
			className="absolute top-0 border-r border-border/50"
			style={{ left, width }}
		>
			<div className="flex flex-col">
				{segment.lanes.map((lane, laneIndex) => {
					switch (lane.kind) {
						case "notes":
							return (
								<NoteLanePlaceholder
									key={`note-${lane.outputKey}-${laneIndex}`}
									lane={lane}
									pxPerBeat={pxPerBeat}
									segmentStartBeat={segment.startBeat}
									hoveredPattern={hoveredPattern}
									onHoverPattern={onHoverPattern}
								/>
							);
						case "audio":
							return (
								<AudioLanePlaceholder
									key={`audio-${lane.patternPath}-${laneIndex}`}
									lane={lane}
									pxPerBeat={pxPerBeat}
									segmentStartBeat={segment.startBeat}
								/>
							);
						case "automation":
							return (
								<AutomationLanePlaceholder
									key={`auto-${lane.patternPath}-${laneIndex}`}
									lane={lane}
									pxPerBeat={pxPerBeat}
									segmentStartBeat={segment.startBeat}
								/>
							);
					}
				})}
			</div>

			{segment.children.map((child, childIndex) => (
				<SegmentComponent
					key={`child-${child.startBeat}-${childIndex}`}
					segment={child}
					pxPerBeat={pxPerBeat}
					hoveredPattern={hoveredPattern}
					onHoverPattern={onHoverPattern}
				/>
			))}
		</div>
	);
});
