import { useCallback } from "react";
import type { ProjectContext } from "../../models/Context";
import type { ProjectState } from "../../models/State/Project";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable";
import { MainPanel } from "./MainPanel";
import { MixerPanel } from "./Mixer/MixerPanel";
import { OverridesPanel } from "./OverridesPanel";
import { Titlebar } from "./Titlebar";

interface LayoutProps {
	readonly context: ProjectContext;
}

export const Layout: React.FC<LayoutProps> = ({ context }) => {
	const { project, projectStore, build } = context;

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
		<div className="flex h-screen flex-col">
			<Titlebar context={context} />

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
							<OverridesPanel />
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel
							id="mixer"
							minSize={10}
						>
							<MixerPanel context={context} />
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
				<ResizableHandle className="h-px w-full" />
				<ResizablePanel
					id="main"
					minSize={10}
				>
					<MainPanel context={context} />
				</ResizablePanel>
			</ResizablePanelGroup>

			{build.error && <div className="shrink-0 border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{build.error}</div>}
		</div>
	);
};
