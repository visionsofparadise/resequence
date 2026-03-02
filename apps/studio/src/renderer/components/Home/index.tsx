import React, { useCallback, useEffect, useState } from "react";
import type { AppContext } from "../../models/Context";
import { useProjectLoader } from "../../utils/projectLoader";
import { Button } from "../ui/button";
import { Icon } from "../ui/Icon";
import { RecentProjectsList } from "./RecentProjectsList";
import { Titlebar } from "./Titlebar";

interface HomeProps {
	readonly context: AppContext;
}

export const Home: React.FC<HomeProps> = ({ context }) => {
	const { appSettings, main, logger } = context;
	const { openProject } = useProjectLoader(context);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		if (appSettings.lastProjectPath) {
			openProject(appSettings.lastProjectPath)
				.then((success) => {
					if (!success) {
						logger.info("Last project no longer has a valid entrypoint, showing home screen", {
							namespace: "ui",
							path: appSettings.lastProjectPath,
						});
					}
				})
				.catch((error: unknown) => {
					logger.error("Failed to restore last project", error as Error, { namespace: "ui" });
				});
		}
	}, []);

	const handleOpenDirectory = useCallback(async () => {
		setError(undefined);

		const result = await main.showOpenDialog({
			title: "Open Project",
			properties: ["openDirectory"],
		});

		const dirPath = result?.[0];
		if (!dirPath) return;

		const success = await openProject(dirPath);

		if (!success) {
			setError(`No resequence entrypoint found in ${dirPath}`);
		}
	}, [main, openProject]);

	const handleSelectRecent = useCallback(
		async (path: string) => {
			setError(undefined);

			const success = await openProject(path);

			if (!success) {
				setError(`No resequence entrypoint found in ${path}`);
			}
		},
		[openProject],
	);

	return (
		<div className="flex h-screen flex-col overflow-y-auto">
			<Titlebar />
			<div className="mx-auto w-full max-w-lg px-8 py-12">
				<div className="mb-8">
					<h1 className="text-2xl font-bold">Resequence Studio</h1>
					<p className="mt-1 text-sm text-muted-foreground">Open a resequence project to get started.</p>
				</div>

				{error && <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

				<div className="mb-6">
					<h2 className="mb-3 text-sm font-medium text-muted-foreground">Recent Projects</h2>
					<RecentProjectsList
						recentProjects={appSettings.recentProjects}
						onSelectProject={handleSelectRecent}
					/>
				</div>

				<Button
					variant="outline"
					className="w-full gap-2"
					onClick={handleOpenDirectory}
				>
					<Icon.FolderOpen className="h-4 w-4" />
					Open Project
				</Button>
			</div>
		</div>
	);
};
