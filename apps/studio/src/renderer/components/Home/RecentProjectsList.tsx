import React from "react";
import type { RecentProject } from "../../../shared/models/AppSettings";
import type { IconProps } from "@resequence/design-system";
import {
	PrimaryIcon,
	BarcodeIcon,
	ConcentricIcon,
	DotCircleIcon,
	DotGridIcon,
	LinesIcon,
	DiagonalIcon,
	CrosshatchIcon,
	CheckerboardIcon,
} from "@resequence/design-system";

const icons: Array<React.ComponentType<IconProps>> = [
	PrimaryIcon,
	BarcodeIcon,
	ConcentricIcon,
	DotCircleIcon,
	DotGridIcon,
	LinesIcon,
	DiagonalIcon,
	CrosshatchIcon,
	CheckerboardIcon,
];

const unitColorVars = [
	"var(--color-unit-1)",
	"var(--color-unit-2)",
	"var(--color-unit-3)",
	"var(--color-unit-4)",
	"var(--color-unit-5)",
	"var(--color-unit-6)",
];

function hashString(input: string): number {
	let hash = 5381;

	for (let ci = 0; ci < input.length; ci++) {
		hash = ((hash << 5) + hash + input.charCodeAt(ci)) | 0;
	}

	return Math.abs(hash);
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

interface RecentProjectsListProps {
	readonly recentProjects: Array<RecentProject>;
	readonly onSelectProject: (path: string) => void;
}

export const RecentProjectsList: React.FC<RecentProjectsListProps> = ({ recentProjects, onSelectProject }) => {
	if (recentProjects.length === 0) {
		return (
			<div className="flex items-center justify-center py-8">
				<span className="type-label text-text-secondary">No recent projects</span>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1 overflow-auto">
			{recentProjects.map((project) => {
				const hash = hashString(project.path);
				const Icon = icons[hash % icons.length] ?? PrimaryIcon;
				const color = unitColorVars[hash % unitColorVars.length] ?? unitColorVars[0];

				return (
					<button
						key={project.path}
						onClick={() => onSelectProject(project.path)}
						className="flex items-center gap-3 bg-transparent border-none cursor-pointer p-0 group text-left"
					>
						<div className="shrink-0">
							<Icon color={color} />
						</div>
						<div className="flex flex-col gap-0.5 min-w-0">
							<span className="type-label text-text-primary group-hover:text-accent-primary transition-colors leading-none">
								{project.name}
							</span>
							<span className="type-label text-[8px] text-dimmed leading-none truncate">{project.path}</span>
							<span className="type-label text-[8px] text-border leading-none">{getRelativeTime(project.lastOpenedAt)}</span>
						</div>
					</button>
				);
			})}
		</div>
	);
};
