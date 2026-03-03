import { useCallback } from "react";
import type { ProjectContext } from "../../models/Context";
import type { ProjectState } from "../../models/State/Project";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable";
import { Canvas } from "./Canvas";
import { Sidebar } from "./Sidebar";
import { Titlebar } from "./Titlebar";

interface LayoutProps {
	readonly context: ProjectContext;
}

export const Layout: React.FC<LayoutProps> = ({ context }) => {
	const { project, projectStore, build } = context;

	const onLayoutChange = useCallback(
		(layout: Record<string, number>) => {
			const sidebarSize = layout.sidebar;

			if (sidebarSize !== undefined) {
				projectStore.mutate<ProjectState>(project, (proxy) => {
					proxy.sidebarWidthPercent.transient.value = sidebarSize;
				});
			}
		},
		[project, projectStore],
	);

	const onLayoutChanged = useCallback(
		(layout: Record<string, number>) => {
			const sidebarSize = layout.sidebar;

			if (sidebarSize !== undefined) {
				projectStore.mutate<ProjectState>(project, (proxy) => {
					proxy.sidebarWidthPercent.committed.value = sidebarSize;
				});
			}
		},
		[project, projectStore],
	);

	return (
		<div className="flex h-screen flex-col">
			<Titlebar context={context} />
			<ResizablePanelGroup
				orientation="horizontal"
				className="flex-1"
				onLayoutChange={onLayoutChange}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel id="canvas">
					<Canvas context={context} />
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel
					id="sidebar"
					defaultSize={project.sidebarWidthPercent._committed}
					minSize={5}
				>
					<Sidebar context={context} />
				</ResizablePanel>
			</ResizablePanelGroup>
			{build.error && <div className="shrink-0 border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{build.error}</div>}
		</div>
	);
};
