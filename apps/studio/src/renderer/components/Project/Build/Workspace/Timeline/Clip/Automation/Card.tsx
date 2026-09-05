import { useClipBounds } from "../hooks/useClipBounds";
import { AutomationCanvas } from "./Canvas";
import type { BuildContext } from "../../../../../../../models/Context";
import type { AutomationClip, Sequence } from "../../../../utils/buildArrangement";

const AUTOMATION_LANE_HEIGHT = 32;

interface AutomationClipCardProps {
	readonly clip: AutomationClip;
	readonly sequence: Sequence;
	readonly context: BuildContext;
}

export const AutomationClipCard: React.FC<AutomationClipCardProps> = ({ clip, sequence, context }) => {
	const innerRef = useClipBounds(clip, sequence, context);

	return (
		<div className="relative border-b border-border" style={{ height: AUTOMATION_LANE_HEIGHT }}>
			<div ref={innerRef} className="absolute top-0 overflow-hidden" style={{ height: AUTOMATION_LANE_HEIGHT }}>
				<AutomationCanvas clip={clip} context={context} />
				<span className="pointer-events-none absolute left-1 top-0.5 rounded-sm bg-surface/60 px-1 type-label">
					{clip.name} &middot; {clip.paths.join(", ")}
				</span>
			</div>
		</div>
	);
};
