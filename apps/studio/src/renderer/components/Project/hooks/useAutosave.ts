import { useEffect, useRef } from "react";
import { subscribe } from "valtio/vanilla";
import type { ProjectContext } from "../../../models/Context";
import { type ProjectState, serializeProjectState } from "../../../models/State/Project";

function hashProjectPath(projectPath: string): string {
	let hash = 0;

	for (const char of projectPath) {
		hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
	}

	return Math.abs(hash).toString(36);
}

export function useProjectAutosave(context: ProjectContext) {
	const { project, projectStore, main, currentProjectPath } = context;

	const pendingWriteRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dirEnsuredRef = useRef(false);

	useEffect(() => {
		const proxy = projectStore.dangerouslyGetProxy<ProjectState>(project._key);

		if (!proxy) return;

		const write = async () => {
			const userDataPath = await main.getUserDataPath();
			const dir = `${userDataPath}/project-state`;

			if (!dirEnsuredRef.current) {
				await main.ensureDirectory(dir);
				dirEnsuredRef.current = true;
			}

			const hash = hashProjectPath(currentProjectPath);
			const filePath = `${dir}/${hash}.json`;
			const json = JSON.stringify(serializeProjectState(proxy));

			await main.writeFile(filePath, json);
		};

		const unsubscribe = subscribe(proxy, () => {
			if (pendingWriteRef.current !== null) {
				clearTimeout(pendingWriteRef.current);
			}

			pendingWriteRef.current = setTimeout(() => {
				pendingWriteRef.current = null;

				void write();
			}, 1000);
		});

		return () => {
			unsubscribe();

			if (pendingWriteRef.current !== null) {
				clearTimeout(pendingWriteRef.current);
				pendingWriteRef.current = null;

				void write();
			}
		};
	}, [project, projectStore, main, currentProjectPath]);
}
