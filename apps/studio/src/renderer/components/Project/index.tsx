import React, { useEffect, useMemo, useState } from "react";
import type { AppContext, ProjectContext } from "../../models/Context";
import { ProxyStore } from "../../models/ProxyStore/ProxyStore";
import { useBuildState } from "../../models/State/Build";
import { useCreateHistoryState } from "../../models/State/History";
import { useOverrideState } from "../../models/State/Override";
import { usePlaybackState } from "../../models/State/Playback";
import { useProjectState } from "../../models/State/Project";
import { useProjectLoader } from "../../utils/projectLoader";
import { resolveEntrypoint } from "../../utils/resolveEntrypoint";
import { Button } from "../ui/button";
import { Icon } from "../ui/Icon";
import { useProjectBuild } from "./hooks/useProjectBuild";
import { useProjectEvaluation } from "./hooks/useProjectEvaluation";

interface ProjectProps {
	readonly currentProjectPath: string;
	readonly context: AppContext;
}

export const Project: React.FC<ProjectProps> = ({ currentProjectPath, context }) => {
	const { app, main } = context;

	const projectStore = useMemo(() => new ProxyStore(), [currentProjectPath]);

	const build = useBuildState(projectStore);
	const history = useCreateHistoryState(projectStore);
	const override = useOverrideState(undefined, projectStore);
	const playback = usePlaybackState(projectStore);
	const project = useProjectState(undefined, projectStore);

	const projectContext = useMemo(
		(): ProjectContext => ({
			...context,
			app,
			build,
			currentProjectPath,
			history,
			override,
			playback,
			project,
			projectStore,
		}),
		[context, app, currentProjectPath, build, history, override, playback, project, projectStore],
	);

	const [entrypoint, setEntrypoint] = useState<string | undefined>();

	useEffect(() => {
		resolveEntrypoint(main, currentProjectPath)
			.then(setEntrypoint)
			.catch(() => undefined);
	}, [main, currentProjectPath]);

	useProjectBuild(entrypoint, projectContext);
	useProjectEvaluation(projectContext);

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
			<div className="relative flex flex-1 overflow-hidden">
				{build.tree !== null && (
					<div className="flex-1 overflow-auto p-4">
						<pre className="text-xs">{JSON.stringify(build.tree, null, 2)}</pre>
					</div>
				)}
				{!build.tree && (
					<div className="flex flex-1 items-center justify-center">
						<div className="text-center">
							<p className="text-lg font-medium">Project loaded</p>
							<p className="mt-1 text-sm text-muted-foreground">{projectContext.currentProjectPath}</p>
						</div>
					</div>
				)}
			</div>
			{build.error && <div className="shrink-0 border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{build.error}</div>}
		</div>
	);
};
