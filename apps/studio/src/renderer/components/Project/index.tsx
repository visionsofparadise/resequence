import React, { useMemo } from "react";
import type { AppContext, ProjectContext } from "../../models/Context";
import { ProxyStore } from "../../models/ProxyStore/ProxyStore";
import { useEvalState } from "../../models/State/Eval";
import { useCreateHistoryState } from "../../models/State/History";
import { useOverrideState } from "../../models/State/Override";
import { usePlaybackState } from "../../models/State/Playback";
import { useProjectState } from "../../models/State/Project";
import { useProjectLoader } from "../../utils/projectLoader";
import { Button } from "../ui/button";
import { Icon } from "../ui/Icon";

interface ProjectProps {
	readonly currentProjectPath: string;
	readonly context: AppContext;
}

export const Project: React.FC<ProjectProps> = ({ currentProjectPath, context }) => {
	const { app } = context;

	const projectStore = useMemo(() => new ProxyStore(), [currentProjectPath]);

	const evalState = useEvalState(projectStore);
	const history = useCreateHistoryState(projectStore);
	const override = useOverrideState(undefined, projectStore);
	const playback = usePlaybackState(projectStore);
	const project = useProjectState(undefined, projectStore);

	const projectContext = useMemo(
		(): ProjectContext => ({
			...context,
			app,
			currentProjectPath,
			eval: evalState,
			history,
			override,
			playback,
			project,
			projectStore,
		}),
		[context, app, currentProjectPath, evalState, history, override, playback, project, projectStore],
	);

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
					<p className="mt-1 text-sm text-muted-foreground">{projectContext.currentProjectPath}</p>
				</div>
			</div>
		</div>
	);
};
