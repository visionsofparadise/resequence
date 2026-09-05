import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../../../models/Context";
import type { Sequence } from "../../../../utils/buildArrangement";

interface ClipBounds {
	readonly startBeat: number;
	readonly endBeat: number;
}

export function useClipBounds(clip: ClipBounds, sequence: Sequence, context: BuildContext) {
	const { project } = context;
	const innerRef = useRef<HTMLDivElement>(null);

	const transients = useMemo(() => [project.timelineZoom], [project.timelineZoom]);

	useTransients(transients, () => {
		if (!innerRef.current) return;

		const pxPerBeat = project.timelineZoom.value;
		const left = (clip.startBeat - sequence.startBeat) * pxPerBeat;
		const width = (clip.endBeat - clip.startBeat) * pxPerBeat;

		innerRef.current.style.left = `${left}px`;
		innerRef.current.style.width = `${width}px`;
	});

	return innerRef;
}
