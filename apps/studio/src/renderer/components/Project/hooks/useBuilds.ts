import { useQuery } from "@tanstack/react-query";
import type { ProjectContext } from "../../../models/Context";

export interface BuildEntry {
	readonly timestamp: number;
	readonly buildPath: string;
}

export function useBuilds(context: ProjectContext): ReadonlyArray<BuildEntry> {
	const { main, queryClient, currentProjectPath } = context;

	const { data } = useQuery(
		{
			queryKey: ["builds", currentProjectPath],
			queryFn: async () => {
				const entries = await main.readDirectory(`${currentProjectPath}/build`);

				const timestamps = entries.map(Number).filter((ts) => !isNaN(ts));
				timestamps.sort((tsA, tsB) => tsB - tsA);

				return timestamps.map((timestamp) => ({
					timestamp,
					buildPath: `${currentProjectPath}/build/${timestamp}`,
				}));
			},
			staleTime: Infinity,
		},
		queryClient,
	);

	return data ?? [];
}
