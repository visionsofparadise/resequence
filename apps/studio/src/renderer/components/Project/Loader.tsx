import { useQuery } from "@tanstack/react-query";
import { Project } from ".";
import type { AppContext } from "../../models/Context";
import { deserializeProjectState, type ProjectStateInitial } from "../../models/State/Project";

interface ProjectLoaderProps {
	readonly currentProjectPath: string;
	readonly context: AppContext;
}

function hashProjectPath(projectPath: string): number {
	let hash = 0;

	for (const char of projectPath) {
		hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
	}

	return Math.abs(hash);
}

export const ProjectLoader: React.FC<ProjectLoaderProps> = ({ currentProjectPath, context }) => {
	const { main } = context;

	const { data: initialProjectState, isLoading } = useQuery<ProjectStateInitial>({
		queryKey: ["project-state", currentProjectPath],
		queryFn: async () => {
			const userDataPath = await main.getUserDataPath();
			const hash = hashProjectPath(currentProjectPath).toString(36);
			const filePath = `${userDataPath}/project-state/${hash}.json`;

			try {
				const content = await main.readFile(filePath);
				const json = JSON.parse(content) as Record<string, unknown>;

				return deserializeProjectState(json);
			} catch {
				return {};
			}
		},
		staleTime: Infinity,
	});

	if (isLoading) return null;

	return (
		<Project
			currentProjectPath={currentProjectPath}
			initialProjectState={initialProjectState}
			context={context}
		/>
	);
};
