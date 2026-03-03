import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Pattern } from "resequence";
import type { ProjectContext } from "../../../models/Context";
import type { OverrideEntry } from "../../../models/State/Override";

export function useProjectEvaluation(context: ProjectContext): void {
	const { main, queryClient } = context;
	const buildPath = context.build.buildPath;

	const contextRef = useRef(context);
	contextRef.current = context;

	const { data: tree, error: treeError } = useQuery(
		{
			queryKey: ["eval-bundle", buildPath],
			queryFn: async () => {
				if (!buildPath) throw new Error("unreachable");

				const bundleStr = await main.readFile(`${buildPath}/bundle.js`);
				const blob = new Blob([bundleStr], { type: "text/javascript" });
				const url = URL.createObjectURL(blob);

				try {
					const mod = (await import(/* @vite-ignore */ url)) as { default: unknown };

					if (!Pattern.is(mod.default)) {
						throw new Error("Module default export is not a Pattern");
					}

					return mod.default;
				} finally {
					URL.revokeObjectURL(url);
				}
			},
			enabled: !!buildPath,
			staleTime: Infinity,
		},
		queryClient,
	);

	const { data: overrides } = useQuery(
		{
			queryKey: ["eval-overrides", buildPath],
			queryFn: async () => {
				if (!buildPath) throw new Error("unreachable");

				try {
					const content = await main.readFile(`${buildPath}/overrides.json`);

					return JSON.parse(content) as Array<OverrideEntry>;
				} catch {
					return [] as Array<OverrideEntry>;
				}
			},
			enabled: !!buildPath,
		},
		queryClient,
	);

	useEffect(() => {
		const { projectStore, override } = contextRef.current;

		projectStore.mutate(override, (proxy) => Object.assign(proxy, { entries: overrides ?? [] }));
	}, [overrides]);

	useEffect(() => {
		const { projectStore, build } = contextRef.current;

		if (treeError) {
			projectStore.mutate(build, (proxy) => Object.assign(proxy, { error: String(treeError) }));
		} else if (tree !== undefined) {
			projectStore.mutate(build, (proxy) => Object.assign(proxy, { tree, error: null, buildPath }));
		}
	}, [tree, treeError, buildPath]);
}
