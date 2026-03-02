import React from "react";
import type { AppContext } from "../../models/Context";
import { useProjectLoader } from "../../utils/projectLoader";
import { Button } from "../ui/button";
import { Icon } from "../ui/Icon";

interface ProjectProps {
	readonly context: AppContext;
}

export const Project: React.FC<ProjectProps> = ({ context }) => {
	const { closeProject } = useProjectLoader(context);

	return (
		<div className="flex h-screen flex-col">
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
			</div>
			<div className="flex flex-1 items-center justify-center">
				<div className="text-center">
					<p className="text-lg font-medium">Project loaded</p>
					<p className="mt-1 text-sm text-muted-foreground">{context.currentProjectPath}</p>
				</div>
			</div>
		</div>
	);
};
