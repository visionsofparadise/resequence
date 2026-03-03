import { basename } from "pathe";
import type { ProjectContext } from "../../models/Context";
import { useProjectLoader } from "../../utils/projectLoader";
import { Button } from "../ui/button";
import { Icon } from "../ui/Icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useBuilds } from "./hooks/useBuilds";

interface TitlebarProps {
	readonly context: ProjectContext;
}

export const Titlebar: React.FC<TitlebarProps> = ({ context }) => {
	const { projectStore, build } = context;

	const { closeProject } = useProjectLoader(context);
	const entries = useBuilds(context);

	const projectName = basename(context.currentProjectPath);

	const formatBuildLabel = (timestamp: number) =>
		new Date(timestamp).toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

	return (
		<div
			className="flex h-[44px] shrink-0 items-center gap-2 px-4"
			style={{ appRegion: "drag" } as React.CSSProperties}
		>
			<Button
				variant="ghost"
				size="sm"
				className="gap-1"
				onClick={closeProject}
				style={{ appRegion: "no-drag" } as React.CSSProperties}
			>
				<Icon.ArrowLeft className="h-4 w-4" />
				Home
			</Button>
			<span className="text-sm font-medium">{projectName}</span>
			{entries.length > 0 && (
				<div style={{ appRegion: "no-drag" } as React.CSSProperties}>
					<Select
						value={build.buildPath ?? undefined}
						onValueChange={(value) => {
							projectStore.mutate(build, (proxy) => Object.assign(proxy, { buildPath: value }));
						}}
					>
						<SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-2 text-xs text-muted-foreground hover:text-foreground">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{entries.map((entry) => (
								<SelectItem
									key={entry.buildPath}
									value={entry.buildPath}
								>
									{formatBuildLabel(entry.timestamp)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
			<div className="flex-1" />
			<div className="w-[68px]" />
		</div>
	);
};
