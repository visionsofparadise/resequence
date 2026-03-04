import { useMemo, useRef } from "react";
import type { ProjectContext } from "../../../../../models/Context";
import { useTransients } from "../../../../../hooks/useTransients";

interface PlayheadProps {
	readonly context: ProjectContext;
}

export const Playhead: React.FC<PlayheadProps> = ({ context }) => {
	const { playback, project } = context;

	const playheadRef = useRef<HTMLDivElement>(null);

	const transients = useMemo(() => [playback.beat, project.timelineZoom, project.timelineScrollX], [playback.beat, project.timelineZoom, project.timelineScrollX]);

	useTransients(transients, () => {
		if (!playheadRef.current) return;

		const x = playback.beat.value * project.timelineZoom.value - project.timelineScrollX.value;

		playheadRef.current.style.transform = `translateX(${x}px)`;
	});

	return (
		<div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
			<div
				ref={playheadRef}
				className="absolute left-0 top-0 h-full w-px bg-red-500"
			>
				<div className="absolute left-1/2 top-0 -translate-x-1/2">
					<div
						className="border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-red-500"
						style={{ width: 0, height: 0 }}
					/>
				</div>
			</div>
		</div>
	);
};
