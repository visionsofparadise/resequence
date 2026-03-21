import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ProjectContext } from "../../../../models/Context";

export function useBundleBuild(entrypoint: string | undefined, context: ProjectContext): void {
	const contextRef = useRef(context);

	contextRef.current = context;

	const buildPathRef = useRef(context.build.buildPath);

	buildPathRef.current = context.build.buildPath;

	const latestBuildPath = useRef<string | null>(null);

	const bundleBuild = useCallback(async (): Promise<void> => {
		if (!entrypoint) return;

		const { main, currentProjectPath, projectStore, build } = contextRef.current;

		let bundleString: string;

		try {
			bundleString = await main.bundleProject(entrypoint);
		} catch (error) {
			projectStore.mutate(build, (proxy) => Object.assign(proxy, { error: String(error) }));

			return;
		}

		const newBuildPath = `${currentProjectPath}/build/${Date.now()}`;

		await main.ensureDirectory(newBuildPath);

		await main.writeFile(`${newBuildPath}/bundle.js`, bundleString);
		await main.writeFile(`${newBuildPath}/overrides.json`, JSON.stringify([]));

		const previousLatest = latestBuildPath.current;

		latestBuildPath.current = newBuildPath;

		if (buildPathRef.current === previousLatest) {
			projectStore.mutate(build, (proxy) => Object.assign(proxy, { buildPath: newBuildPath }));
		}

		void context.queryClient.invalidateQueries({ queryKey: ["builds", currentProjectPath] });

		toast("Build ready");
	}, [entrypoint]);

	useEffect(() => {
		if (!entrypoint) return;

		const { main, currentProjectPath } = contextRef.current;

		void main.openWatcher(currentProjectPath);

		const init = async (): Promise<void> => {
			const entries = await main.readDirectory(`${currentProjectPath}/build`);

			const timestamps = entries.map(Number).filter((ts) => !isNaN(ts));

			timestamps.sort((timestampA, timestampB) => timestampB - timestampA);

			if (timestamps.length > 0) {
				const latest = `${currentProjectPath}/build/${timestamps[0]}`;

				latestBuildPath.current = latest;

				const { projectStore, build } = contextRef.current;

				projectStore.mutate(build, (proxy) => Object.assign(proxy, { buildPath: latest }));
			} else {
				await bundleBuild();
			}
		};

		void init();

		const handleChange = () => void bundleBuild();

		main.events.on("change", handleChange);

		return () => {
			main.events.off("change", handleChange);
			void main.closeWatcher();
		};
	}, [entrypoint, bundleBuild]);
}
