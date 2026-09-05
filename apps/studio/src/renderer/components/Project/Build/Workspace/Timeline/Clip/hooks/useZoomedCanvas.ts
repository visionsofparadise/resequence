import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../../../models/Context";

export function useZoomedCanvas(context: BuildContext, draw: (canvas: HTMLCanvasElement, pxPerBeat: number) => void) {
	const { project } = context;
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const transients = useMemo(() => [project.timelineZoom], [project.timelineZoom]);

	useTransients(transients, () => {
		const canvas = canvasRef.current;

		if (!canvas) return;

		draw(canvas, project.timelineZoom.value);
	});

	return canvasRef;
}
