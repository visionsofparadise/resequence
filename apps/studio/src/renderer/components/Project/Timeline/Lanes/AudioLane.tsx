import { memo, useCallback, useEffect, useRef } from "react";
import type { TempoMap } from "resequence";
import { beatsToSeconds } from "resequence";
import type { ProjectContext } from "../../../../models/Context";
import type { AudioLane as AudioLaneData } from "../aggregation/types";
import { AUDIO_LANE_HEIGHT } from "../constants";
import { drawWaveform } from "../waveform/drawWaveform";
import { useWaveformData } from "../waveform/useWaveformData";

interface AudioLaneProps {
	readonly lane: AudioLaneData;
	readonly pxPerBeat: number;
	readonly segmentStartBeat: number;
	readonly context: ProjectContext;
	readonly tempoMap: TempoMap;
}

export const AudioLaneComponent = memo<AudioLaneProps>(({ lane, pxPerBeat, segmentStartBeat, context, tempoMap }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { data: waveform, isLoading, error } = useWaveformData(lane.filePath, context);

	const left = (lane.startBeat - segmentStartBeat) * pxPerBeat;
	const width = (lane.endBeat - lane.startBeat) * pxPerBeat;

	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !waveform) return;

		const dpr = window.devicePixelRatio || 1;
		const displayWidth = Math.max(1, Math.floor(width));
		const displayHeight = AUDIO_LANE_HEIGHT;

		canvas.width = displayWidth * dpr;
		canvas.height = displayHeight * dpr;
		canvas.style.width = `${displayWidth}px`;
		canvas.style.height = `${displayHeight}px`;

		const canvasCtx = canvas.getContext("2d");
		if (!canvasCtx) return;

		canvasCtx.scale(dpr, dpr);

		const playFromSeconds = beatsToSeconds(lane.playFromBeats, tempoMap);
		const laneStartSeconds = beatsToSeconds(lane.startBeat, tempoMap);
		const laneEndSeconds = beatsToSeconds(lane.endBeat, tempoMap);
		const displaySeconds = laneEndSeconds - laneStartSeconds;

		drawWaveform(canvasCtx, waveform, displayWidth, displayHeight, playFromSeconds * 1000, displaySeconds * 1000, lane.reversed);
	}, [waveform, width, lane.playFromBeats, lane.startBeat, lane.endBeat, lane.reversed, tempoMap]);

	useEffect(() => {
		draw();
	}, [draw]);

	return (
		<div
			className="relative border-b border-border"
			style={{ height: AUDIO_LANE_HEIGHT }}
		>
			<div
				className="absolute top-0 overflow-hidden rounded-sm border border-muted-foreground/30 bg-muted/50"
				style={{ left, width, height: AUDIO_LANE_HEIGHT }}
			>
				{isLoading && (
					<div className="absolute inset-0 animate-pulse bg-muted/30" />
				)}
				{error && !waveform && (
					<div className="flex h-full items-center px-1.5">
						<span className="truncate text-[10px] text-muted-foreground">{lane.name}</span>
					</div>
				)}
				{waveform && (
					<canvas
						ref={canvasRef}
						className="absolute inset-0"
					/>
				)}
				<span className="absolute left-1.5 top-0.5 truncate text-[10px] text-muted-foreground drop-shadow-sm">
					{lane.name}
				</span>
			</div>
		</div>
	);
});
