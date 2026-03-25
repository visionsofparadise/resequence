import React, { useCallback, useEffect, useState } from "react";
import { Button, DomainWarpShader } from "@resequence/design-system";
import type { AppContext } from "../../models/Context";
import { useProjectLoader } from "../../utils/projectLoader";
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
		<div className="flex h-screen flex-col">
			<Titlebar />
			<div className="flex-1 min-h-0 flex items-center justify-center">
				<div className="grid w-full border-t border-b border-border" style={{ gridTemplateColumns: "2fr 1fr", gridTemplateRows: "auto 240px" }}>
					<div className="border-r border-b border-border p-8 relative overflow-hidden">
						<p className="type-label mb-3 text-accent-primary">HOME</p>
						<h1 className="type-display text-[56px] leading-none">RESEQUENCE</h1>
						<p className="type-display-outline text-[56px] leading-none mt-1">RESEQUENCE</p>
						<p className="type-label mt-4 text-dimmed">AUDIO AS CODE</p>
						<span className="type-label text-dimmed absolute bottom-3 right-4">V0.1.0</span>
					</div>

					<div className="border-b border-border p-6 flex flex-col">
						<p className="type-label mb-4">RECENT</p>
						<RecentProjectsList
							recentProjects={appSettings.recentProjects}
							onSelectProject={handleSelectRecent}
						/>
					</div>

					<div className="border-r border-border overflow-hidden rounded relative">
						<div className="absolute inset-0">
							<DomainWarpShader />
						</div>
					</div>

					<div className="border-border p-6 flex flex-col justify-between">
						<p className="type-label mb-4">PROJECT</p>

						{error && (
							<div className="mb-4 px-3 py-2 border border-accent-primary/30 bg-accent-primary/10 type-label text-accent-primary">
								{error}
							</div>
						)}

						<div className="flex flex-col gap-3 mt-auto">
							<Button disabled>CREATE PROJECT</Button>
							<Button variant="outline" onClick={handleOpenDirectory}>OPEN PROJECT</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
