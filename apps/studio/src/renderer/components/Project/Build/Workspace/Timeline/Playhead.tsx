import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../hooks/useTransients";
import type { ProjectContext } from "../../../../../models/Context";

interface PlayheadProps {
	readonly context: ProjectContext;
}

export const Playhead: React.FC<PlayheadProps> = ({ context }) => {
	const { playback, project } = context;

	const playheadRef = useRef<HTMLDivElement>(null);

	const transients = useMemo(
		() => [playback.beat, project.timelineZoom, project.timelineScrollX],
		[playback.beat, project.timelineZoom, project.timelineScrollX],
	);

	useTransients(transients, () => {
		if (!playheadRef.current) return;

		const x = playback.beat.value * project.timelineZoom.value - project.timelineScrollX.value;

		playheadRef.current.style.transform = `translateX(${x}px)`;
	});

	return (
		<div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
			<div ref={playheadRef} className="absolute left-0 top-0 h-full w-px bg-accent-primary" />
		</div>
	);
};
