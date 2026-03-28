import { useMemo, useRef } from "react";
import { beatsToSeconds } from "resequence";
import type { WaveformBinary } from "../../../../../../../../shared/utilities/waveform/WaveformCodec";
import { useTransients } from "../../../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../../../models/Context";
import type { AudioClip } from "../../../../utils/buildArrangement";
import { drawWaveform } from "./utils/drawWaveform";

const AUDIO_LANE_HEIGHT = 48;

interface AudioCanvasProps {
	readonly clip: AudioClip;
	readonly context: BuildContext;
	readonly waveform: WaveformBinary;
}

export const AudioCanvas: React.FC<AudioCanvasProps> = ({ clip, context, waveform }) => {
	const { project, tempoMap } = context;
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const transients = useMemo(() => [project.timelineZoom], [project.timelineZoom]);

	useTransients(transients, () => {
		const canvas = canvasRef.current;

		if (!canvas) return;

		const pxPerBeat = project.timelineZoom.value;
		const width = (clip.endBeat - clip.startBeat) * pxPerBeat;
		const displayWidth = Math.max(1, Math.floor(width));
		const dpr = window.devicePixelRatio || 1;

		canvas.width = displayWidth * dpr;
		canvas.height = AUDIO_LANE_HEIGHT * dpr;
		canvas.style.width = `${displayWidth}px`;
		canvas.style.height = `${AUDIO_LANE_HEIGHT}px`;

		const context2d = canvas.getContext("2d");

		if (!context2d) return;

		context2d.scale(dpr, dpr);

		const playFromSeconds = beatsToSeconds(clip.playFromBeats, tempoMap);
		const laneStartSeconds = beatsToSeconds(clip.startBeat, tempoMap);
		const laneEndSeconds = beatsToSeconds(clip.endBeat, tempoMap);
		const displaySeconds = laneEndSeconds - laneStartSeconds;

		drawWaveform(context2d, waveform, displayWidth, AUDIO_LANE_HEIGHT, playFromSeconds * 1000, displaySeconds * 1000, clip.reversed);
	});

	return <canvas ref={canvasRef} className="absolute inset-0" />;
};
