import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../../../models/Context";
import type { AutomationClip } from "../../../../utils/buildArrangement";
import { drawEnvelope } from "./utils/drawEnvelope";
import { drawLfo } from "./utils/drawLfo";
import { isKeyframes } from "./utils/isKeyframes";

const AUTOMATION_LANE_HEIGHT = 32;

interface AutomationCanvasProps {
	readonly clip: AutomationClip;
	readonly context: BuildContext;
}

export const AutomationCanvas: React.FC<AutomationCanvasProps> = ({ clip, context }) => {
	const { project } = context;
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const transients = useMemo(() => [project.timelineZoom], [project.timelineZoom]);

	useTransients(transients, () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const pxPerBeat = project.timelineZoom.value;
		const totalBeats = clip.endBeat - clip.startBeat;
		const width = totalBeats * pxPerBeat;
		const height = AUTOMATION_LANE_HEIGHT;

		if (width <= 0 || totalBeats <= 0) return;

		const dpr = window.devicePixelRatio || 1;

		canvas.width = Math.ceil(width * dpr);
		canvas.height = Math.ceil(height * dpr);

		const context2d = canvas.getContext("2d");
		if (!context2d) return;

		context2d.setTransform(dpr, 0, 0, dpr, 0, 0);
		context2d.clearRect(0, 0, width, height);

		if (isKeyframes(clip.source)) {
			drawEnvelope(context2d, clip.source, width, height, clip.startBeat, pxPerBeat);
		} else {
			drawLfo(context2d, clip.source, width, height, clip.startBeat, totalBeats);
		}
	});

	return (
		<canvas
			ref={canvasRef}
			className="h-full w-full"
		/>
	);
};
