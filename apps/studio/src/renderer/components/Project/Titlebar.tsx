import { basename } from "pathe";
import type { ProjectContext } from "../../models/Context";
import { useProjectLoader } from "../../utils/projectLoader";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Icon } from "../ui/Icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useBuilds } from "./hooks/useBuilds";

interface TitlebarProps {
	readonly context: ProjectContext;
}

export const Titlebar: React.FC<TitlebarProps> = ({ context }) => {
	const { projectStore, build, history } = context;

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
			<div style={{ appRegion: "no-drag" } as React.CSSProperties}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Icon.Menu className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							disabled={!history.canUndo}
							onSelect={() => history.undo()}
						>
							<Icon.Undo className="h-4 w-4" />
							Undo
							<DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!history.canRedo}
							onSelect={() => history.redo()}
						>
							<Icon.Redo className="h-4 w-4" />
							Redo
							<DropdownMenuShortcut>Ctrl+Shift+Z</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => { /* TODO: navigate to settings */ }}>
							<Icon.Settings className="h-4 w-4" />
							Settings
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={closeProject}>
							<Icon.Home className="h-4 w-4" />
							Close Project
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
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
