import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../../../models/Context";
import type { BuildState } from "../../../../../../../models/State/Build";
import type { MidiClip, PatternSpan, Sequence } from "../../../../utils/buildArrangement";

interface PatternBoundaryProps {
	readonly span: PatternSpan;
	readonly clip: MidiClip;
	readonly sequence: Sequence;
	readonly context: BuildContext;
}

export const PatternBoundary: React.FC<PatternBoundaryProps> = ({ span, clip, sequence, context }) => {
	const { project, build, projectStore } = context;
	const ref = useRef<HTMLDivElement>(null);

	const transients = useMemo(() => [project.timelineZoom], [project.timelineZoom]);

	useTransients(transients, () => {
		if (!ref.current) return;

		const pxPerBeat = project.timelineZoom.value;

		ref.current.style.left = `${(span.startBeat - sequence.startBeat) * pxPerBeat}px`;
		ref.current.style.width = `${(span.endBeat - span.startBeat) * pxPerBeat}px`;
	});

	const pxPerBeat = project.timelineZoom.value;
	const hoveredPattern = build.hoveredPattern;
	const left = (span.startBeat - sequence.startBeat) * pxPerBeat;
	const width = (span.endBeat - span.startBeat) * pxPerBeat;
	const isHovered = hoveredPattern === span.patternId;
	const isDimmed = hoveredPattern !== null && !isHovered;

	return (
		<div
			ref={ref}
			className="absolute inset-y-0"
			style={{
				left,
				width,
				border: `1px solid ${clip.color}`,
				opacity: isDimmed ? 0.3 : isHovered ? 1 : 0.6,
			}}
			onMouseEnter={() => {
				projectStore.mutate<BuildState>(build, (proxy) => {
					proxy.hoveredPattern = span.patternId;
				});
			}}
			onMouseLeave={() => {
				projectStore.mutate<BuildState>(build, (proxy) => {
					proxy.hoveredPattern = null;
				});
			}}
		>
			<span className="absolute left-0.5 top-0.5 text-[10px] text-muted-foreground">{span.patternType}</span>
		</div>
	);
};
