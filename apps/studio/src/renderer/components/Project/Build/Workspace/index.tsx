import { useCallback, useEffect } from "react";
import type { BuildContext } from "../../../../models/Context";
import type { ProjectState } from "../../../../models/State/Project";
import { ActiveView } from "./ActiveView";

interface WorkspaceProps {
	readonly context: BuildContext;
}

export const Workspace: React.FC<WorkspaceProps> = ({ context }) => {
	const { project, projectStore } = context;

	const goBack = useCallback(() => {
		projectStore.mutate<ProjectState>(project, (proxy) => {
			proxy.activePianoRoll = null;
			proxy.activePort = null;
		});
	}, [project, projectStore]);

	const isDrillDown = project.activePort !== null || project.activePianoRoll !== null;

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
		<div className="h-full">
			<ActiveView
				context={context}
				goBack={goBack}
			/>
		</div>
	);
};
