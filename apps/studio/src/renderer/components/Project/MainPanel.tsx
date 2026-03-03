import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useEffect } from "react";
import type { ProjectContext } from "../../models/Context";
import type { ProjectState } from "../../models/State/Project";
import { PianoRollView } from "./PianoRoll/PianoRollView";
import { TimelineView } from "./Timeline/TimelineView";
import { TransportRibbon } from "./Timeline/TransportRibbon";
import { UnitGraphView } from "./UnitGraph/UnitGraphView";

interface MainPanelProps {
	readonly context: ProjectContext;
}

export const MainPanel: React.FC<MainPanelProps> = ({ context }) => {
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

	if (project.activeOutput) {
		return (
			<ReactFlowProvider>
				<UnitGraphView
					context={context}
					outputId={project.activeOutput}
					onBack={goBack}
				/>
			</ReactFlowProvider>
		);
	}

	if (project.activePianoRoll) {
		return (
			<div className="flex h-full flex-col">
				<PianoRollView context={context} target={project.activePianoRoll} onBack={goBack} />
				<TransportRibbon context={context} />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<TimelineView context={context} />
			<TransportRibbon context={context} />
		</div>
	);
};
