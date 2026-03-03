import { useCallback } from "react";
import type { ProjectContext } from "../../../models/Context";
import type { ProjectState } from "../../../models/State/Project";
import { ScrollArea } from "../../ui/scroll-area";
import { useOutputs } from "../hooks/useOutputs";
import { ChannelStrip } from "./ChannelStrip";

interface MixerPanelProps {
	readonly context: ProjectContext;
}

export const MixerPanel: React.FC<MixerPanelProps> = ({ context }) => {
	const outputs = useOutputs(context);
	const { project, projectStore } = context;

	const onSelect = useCallback(
		(outputId: string) => {
			projectStore.mutate<ProjectState>(project, (proxy) => {
				proxy.activePianoRoll = null;
				proxy.activeOutput = outputId;
			});
		},
		[project, projectStore],
	);

	return (
		<div className="flex h-full flex-col">
			<div className="shrink-0 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
				Outputs
			</div>
			{outputs.length === 0 ? (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-sm text-muted-foreground">No outputs</p>
				</div>
			) : (
				<ScrollArea className="flex-1">
					<div className="space-y-1 px-2 pb-2">
						{outputs.map((output) => (
							<ChannelStrip
								key={output.id}
								output={output}
								isActive={project.activeOutput === output.id}
								onSelect={onSelect}
							/>
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	);
};
