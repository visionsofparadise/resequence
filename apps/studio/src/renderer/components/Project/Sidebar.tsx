import type { ProjectContext } from "../../models/Context";
import type { ProjectState } from "../../models/State/Project";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface SidebarProps {
	readonly context: ProjectContext;
}

export const Sidebar: React.FC<SidebarProps> = ({ context }) => {
	const { project, projectStore } = context;

	return (
		<Tabs
			value={project.sidebarTab}
			onValueChange={(value) => {
				projectStore.mutate<ProjectState>(project, (proxy) => {
					proxy.sidebarTab = value as typeof proxy.sidebarTab;
				});
			}}
			className="flex h-full flex-col"
		>
			<TabsList className="mx-2 mt-2 shrink-0">
				<TabsTrigger value="builds" className="flex-1">Builds</TabsTrigger>
				<TabsTrigger value="nodes" className="flex-1">Nodes</TabsTrigger>
				<TabsTrigger value="overrides" className="flex-1">Overrides</TabsTrigger>
			</TabsList>
			<TabsContent value="builds" className="flex-1 overflow-auto p-4">
				<p className="text-sm text-muted-foreground">Builds</p>
			</TabsContent>
			<TabsContent value="nodes" className="flex-1 overflow-auto p-4">
				<p className="text-sm text-muted-foreground">Nodes</p>
			</TabsContent>
			<TabsContent value="overrides" className="flex-1 overflow-auto p-4">
				<p className="text-sm text-muted-foreground">Overrides</p>
			</TabsContent>
		</Tabs>
	);
};
