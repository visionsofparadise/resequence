import React from "react";
import type { RecentProject } from "../../../shared/models/AppSettings";
import { Icon } from "../ui/Icon";

interface RecentProjectsListProps {
	readonly recentProjects: Array<RecentProject>;
	readonly onSelectProject: (path: string) => void;
}

const getRelativeTime = (timestamp: number): string => {
	const now = Date.now();
	const diffMs = now - timestamp;
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

	if (diffDays > 0) return rtf.format(-diffDays, "day");
	if (diffHours > 0) return rtf.format(-diffHours, "hour");
	if (diffMinutes > 0) return rtf.format(-diffMinutes, "minute");

	return rtf.format(-diffSeconds, "second");
};

export const RecentProjectsList: React.FC<RecentProjectsListProps> = ({ recentProjects, onSelectProject }) => {
	if (recentProjects.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
				<Icon.FolderOpen className="h-8 w-8" />
				<p className="text-sm">No recent projects</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			{recentProjects.map((project) => (
				<button
					key={project.path}
					onClick={() => onSelectProject(project.path)}
					className="flex flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent"
				>
					<span className="truncate text-sm font-medium">{project.name}</span>
					<div className="flex items-center gap-2">
						<span className="truncate text-xs text-muted-foreground">{project.path}</span>
						<span className="shrink-0 text-xs text-muted-foreground">
							{getRelativeTime(project.lastOpenedAt)}
						</span>
					</div>
				</button>
			))}
		</div>
	);
};
