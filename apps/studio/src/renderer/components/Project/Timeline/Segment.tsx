import { memo } from "react";
import type { TempoMap } from "resequence";
import type { ProjectContext } from "../../../models/Context";
import type { PianoRollTarget } from "../../../models/State/Project";
import type { TimelineSegment } from "./aggregation/types";
import { AudioLaneComponent } from "./Lanes/AudioLane";
import { AutomationLane } from "./Lanes/AutomationLane";
import { NoteLane } from "./Lanes/NoteLane";

interface SegmentProps {
	readonly segment: TimelineSegment;
	readonly segmentPath: Array<number>;
	readonly pxPerBeat: number;
	readonly pitchZoom: number;
	readonly hoveredPattern: string | null;
	readonly onHoverPattern: (path: string | null) => void;
	readonly onOpenPianoRoll: (target: PianoRollTarget) => void;
	readonly context: ProjectContext;
	readonly tempoMap: TempoMap;
}

export const SegmentComponent = memo<SegmentProps>(({ segment, segmentPath, pxPerBeat, pitchZoom, hoveredPattern, onHoverPattern, onOpenPianoRoll, context, tempoMap }) => {
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
								<NoteLane
									key={`note-${lane.outputKey}-${laneIndex}`}
									lane={lane}
									pxPerBeat={pxPerBeat}
									pitchZoom={pitchZoom}
									segmentStartBeat={segment.startBeat}
									segmentEndBeat={segment.endBeat}
									hoveredPattern={hoveredPattern}
									onHoverPattern={onHoverPattern}
									onClickLane={() => onOpenPianoRoll({ segmentPath, laneIndex })}
								/>
							);
						case "audio":
							return (
								<AudioLaneComponent
									key={`audio-${lane.patternPath}-${laneIndex}`}
									lane={lane}
									pxPerBeat={pxPerBeat}
									segmentStartBeat={segment.startBeat}
									context={context}
									tempoMap={tempoMap}
								/>
							);
						case "automation":
							return (
								<AutomationLane
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
					segmentPath={[...segmentPath, childIndex]}
					pxPerBeat={pxPerBeat}
					pitchZoom={pitchZoom}
					hoveredPattern={hoveredPattern}
					onHoverPattern={onHoverPattern}
					onOpenPianoRoll={onOpenPianoRoll}
					context={context}
					tempoMap={tempoMap}
				/>
			))}
		</div>
	);
});
