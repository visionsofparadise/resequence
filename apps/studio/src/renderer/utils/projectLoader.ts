import { useCallback } from "react";
import type { RecentProject } from "../../shared/models/AppSettings";
import type { AppContext } from "../models/Context";
import { useSetAppSettings } from "./appSettings";
import { resolveEntrypoint } from "./resolveEntrypoint";

const MAX_RECENT_PROJECTS = 10;

const getProjectName = (dirPath: string): string => {
	const segments = dirPath.replace(/\\/g, "/").split("/");

	return segments[segments.length - 1] ?? dirPath;
};

export const useProjectLoader = (context: AppContext) => {
	const { main, setCurrentProjectPath, appSettings } = context;

	const setAppSettings = useSetAppSettings(main);

	const addToRecentProjects = useCallback(
		(name: string, path: string) => {
			const filtered = appSettings.recentProjects.filter((project) => project.path !== path);
			const entry: RecentProject = { name, path, lastOpenedAt: Date.now() };
			const updated = [entry, ...filtered].slice(0, MAX_RECENT_PROJECTS);

			setAppSettings.mutate({ recentProjects: updated });
		},
		[appSettings.recentProjects, setAppSettings],
	);

	const openProject = useCallback(
		async (dirPath: string): Promise<boolean> => {
			const entrypoint = await resolveEntrypoint(main, dirPath);

			if (!entrypoint) {
				return false;
			}

			const name = getProjectName(dirPath);

			addToRecentProjects(name, dirPath);
			setAppSettings.mutate({ lastProjectPath: dirPath });
			setCurrentProjectPath(dirPath);

			return true;
		},
		[main, addToRecentProjects, setAppSettings, setCurrentProjectPath],
	);

	const closeProject = useCallback(() => {
		setCurrentProjectPath(undefined);
		setAppSettings.mutate({ lastProjectPath: undefined });
	}, [setCurrentProjectPath, setAppSettings]);

	return { openProject, closeProject };
};
