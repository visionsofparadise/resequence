import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../../../models/Context";
import type { AutomationClip, Sequence } from "../../../../utils/buildArrangement";
import { AutomationCanvas } from "./Canvas";

const AUTOMATION_LANE_HEIGHT = 32;

interface AutomationClipCardProps {
	readonly clip: AutomationClip;
	readonly sequence: Sequence;
	readonly context: BuildContext;
}

export const AutomationClipCard: React.FC<AutomationClipCardProps> = ({ clip, sequence, context }) => {
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

	return (
		<div
			className="relative border-b border-border"
			style={{ height: AUTOMATION_LANE_HEIGHT }}
		>
			<div
				ref={innerRef}
				className="absolute top-0 overflow-hidden"
				style={{ height: AUTOMATION_LANE_HEIGHT }}
			>
				<AutomationCanvas clip={clip} context={context} />
				<span className="pointer-events-none absolute left-1 top-0.5 rounded-sm bg-background/60 px-1 text-[10px] text-muted-foreground">
					{clip.name} &middot; {clip.paths.join(", ")}
				</span>
			</div>
		</div>
	);
};
