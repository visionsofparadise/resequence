import React, { useEffect, useMemo, useState } from "react";
import type { AppContext, ProjectContext } from "../../models/Context";
import { ProxyStore } from "../../models/ProxyStore/ProxyStore";
import { useBuildState } from "../../models/State/Build";
import { useCreateHistoryState } from "../../models/State/History";
import { useOverrideState } from "../../models/State/Override";
import { usePlaybackState } from "../../models/State/Playback";
import { useProjectState, type ProjectStateInitial } from "../../models/State/Project";
import { resolveEntrypoint } from "../../utils/resolveEntrypoint";
import { useProjectBuild } from "./hooks/useProjectBuild";
import { useProjectEvaluation } from "./hooks/useProjectEvaluation";
import { useProjectStatePersistence } from "./hooks/useProjectStatePersistence";
import { Layout } from "./Layout";

interface ProjectProps {
	readonly currentProjectPath: string;
	readonly initialProjectState?: ProjectStateInitial;
	readonly context: AppContext;
}

export const Project: React.FC<ProjectProps> = ({ currentProjectPath, initialProjectState, context }) => {
	const { app, main } = context;

	const projectStore = useMemo(() => new ProxyStore(), [currentProjectPath]);

	const build = useBuildState(projectStore);
	const history = useCreateHistoryState(projectStore);
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

	const [entrypoint, setEntrypoint] = useState<string | undefined>();

	useEffect(() => {
		resolveEntrypoint(main, currentProjectPath)
			.then(setEntrypoint)
			.catch(() => undefined);
	}, [main, currentProjectPath]);

	useProjectBuild(entrypoint, projectContext);
	useProjectEvaluation(projectContext);
	useProjectStatePersistence(projectContext);

	return <Layout context={projectContext} />;
};
