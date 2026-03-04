import React, { useMemo } from "react";
import type { AppContext, ProjectContext } from "../../models/Context";
import { ProxyStore } from "../../models/ProxyStore/ProxyStore";
import { useBuildState } from "../../models/State/Build";
import { useHistoryState } from "../../models/State/History";
import { useOverrideState } from "../../models/State/Override";
import { usePlaybackState } from "../../models/State/Playback";
import { useProjectState, type ProjectStateInitial } from "../../models/State/Project";
import { Layout } from "./Layout";
import { useProjectAutosave } from "./hooks/useAutosave";

interface ProjectProps {
	readonly currentProjectPath: string;
	readonly initialProjectState?: ProjectStateInitial;
	readonly context: AppContext;
}

export const Project: React.FC<ProjectProps> = ({ currentProjectPath, initialProjectState, context }) => {
	const { app } = context;

	const projectStore = useMemo(() => new ProxyStore(), [currentProjectPath]);

	const build = useBuildState(projectStore);
	const history = useHistoryState(projectStore);
	const override = useOverrideState(undefined, projectStore);
	const playback = usePlaybackState(projectStore);
	const project = useProjectState(initialProjectState, projectStore);

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

	useProjectAutosave(projectContext);

	return <Layout context={projectContext} />;
};
