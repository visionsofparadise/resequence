import { useCallback, useEffect } from "react";
import type { BuildContext } from "../../../../models/Context";
import type { ProjectState } from "../../../../models/State/Project";
import { ActiveView } from "./ActiveView";
import { WorkspaceToolbar } from "./Toolbar";

interface WorkspaceProps {
	readonly context: BuildContext;
}

export const Workspace: React.FC<WorkspaceProps> = ({ context }) => {
	const { project, projectStore } = context;

	const goBack = useCallback(() => {
		projectStore.mutate<ProjectState>(project, (proxy) => {
			proxy.activePianoRoll = null;
			proxy.activeOutput = null;
		});
	}, [project, projectStore]);

	const isDrillDown = project.activeOutput !== null || project.activePianoRoll !== null;

	useEffect(() => {
		if (!isDrillDown) return;

		const handler = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				goBack();
			}
		};

		window.addEventListener("keydown", handler);

		return () => window.removeEventListener("keydown", handler);
	}, [isDrillDown, goBack]);

	return (
		<div className="flex h-full flex-col">
			<div className="min-h-0 flex-1">
				<ActiveView
					context={context}
					goBack={goBack}
				/>
			</div>
			<WorkspaceToolbar context={context} />
		</div>
	);
};
