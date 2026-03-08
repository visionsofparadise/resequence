import { useCallback } from "react";
import type { BuildContext } from "../../../models/Context";
import type { ProjectState } from "../../../models/State/Project";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../ui/resizable";
import { Overrides } from "./Overrides";
import { Ports } from "./Ports";
import { Workspace } from "./Workspace";

interface BuildLayoutProps {
	readonly context: BuildContext;
}

export const BuildLayout: React.FC<BuildLayoutProps> = ({ context }) => {
	const { project, projectStore } = context;

	const onTopHeightChange = useCallback(
		(layout: Record<string, number>) => {
			const topSize = layout.top;

			if (topSize !== undefined) {
				projectStore.mutate<ProjectState>(project, (proxy) => {
					proxy.topHeightPercent.transient.value = topSize;
				});
			}
		},
		[project, projectStore],
	);

	const onTopHeightChanged = useCallback(
		(layout: Record<string, number>) => {
			const topSize = layout.top;

			if (topSize !== undefined) {
				projectStore.mutate<ProjectState>(project, (proxy) => {
					proxy.topHeightPercent.committed.value = topSize;
				});
			}
		},
		[project, projectStore],
	);

	const onOverridesWidthChange = useCallback(
		(layout: Record<string, number>) => {
			const overridesSize = layout.overrides;

			if (overridesSize !== undefined) {
				projectStore.mutate<ProjectState>(project, (proxy) => {
					proxy.overridesWidthPercent.transient.value = overridesSize;
				});
			}
		},
		[project, projectStore],
	);

	const onOverridesWidthChanged = useCallback(
		(layout: Record<string, number>) => {
			const overridesSize = layout.overrides;

			if (overridesSize !== undefined) {
				projectStore.mutate<ProjectState>(project, (proxy) => {
					proxy.overridesWidthPercent.committed.value = overridesSize;
				});
			}
		},
		[project, projectStore],
	);

	return (
		<ResizablePanelGroup
			orientation="vertical"
			className="flex-1"
			onLayoutChange={onTopHeightChange}
			onLayoutChanged={onTopHeightChanged}
		>
			<ResizablePanel
				id="top"
				defaultSize={project.topHeightPercent._committed}
				minSize={10}
			>
				<ResizablePanelGroup
					orientation="horizontal"
					onLayoutChange={onOverridesWidthChange}
					onLayoutChanged={onOverridesWidthChanged}
				>
					<ResizablePanel
						id="overrides"
						defaultSize={project.overridesWidthPercent._committed}
						minSize={10}
					>
						<Overrides />
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel
						id="mixer"
						minSize={10}
					>
						<Ports context={context} />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>
			<ResizableHandle className="h-px w-full" />
			<ResizablePanel
				id="main"
				minSize={10}
			>
				<Workspace context={context} />
			</ResizablePanel>
		</ResizablePanelGroup>
	);
};
