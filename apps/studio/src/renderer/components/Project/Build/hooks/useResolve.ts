import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Router, router, sequence } from "resequence";
import type { ProjectContext } from "../../../../models/Context";
import type { OverrideEntry } from "../../../../models/State/Override";

export function useResolveBuild(context: ProjectContext): { router: Router; overrides: Array<OverrideEntry> } {
	const { build, main, queryClient } = context;

	const buildPath = build.buildPath;

	const contextRef = useRef(context);

	contextRef.current = context;

	const { data: resolvedSource, error } = useQuery(
		{
			queryKey: ["eval-bundle", buildPath],
			queryFn: async () => {
				if (!buildPath) throw new Error("unreachable");

				const bundleStr = await main.readFile(`${buildPath}/bundle.js`);
				const blob = new Blob([bundleStr], { type: "text/javascript" });
				const url = URL.createObjectURL(blob);

				try {
					const mod = (await import(/* @vite-ignore */ url)) as { default: unknown };

					if (!Router.is(mod.default)) {
						throw new Error("Module default export is not a Router");
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
		const { projectStore, build } = contextRef.current;

		if (error) {
			projectStore.mutate(build, (proxy) => Object.assign(proxy, { error: String(error) }));
		}
	}, [resolvedSource, error, buildPath]);

	return { router: resolvedSource ?? router(sequence(), {}), overrides: overrides ?? [] };
}
