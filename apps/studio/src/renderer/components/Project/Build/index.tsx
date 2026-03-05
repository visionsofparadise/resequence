import { resolveEntrypoint } from "@/renderer/utils/resolveEntrypoint";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuildContext, ProjectContext } from "../../../models/Context";
import { useBuildArrangement } from "./hooks/useBuildArrangement";
import { useBundleBuild } from "./hooks/useBundle";
import { useMapGraph } from "./hooks/useMapGraph";
import { useResolveBuild } from "./hooks/useResolve";
import { useSetupPlayback } from "./hooks/useSetup";
import { BuildLayout } from "./Layout";

interface BuildProps {
	readonly context: ProjectContext;
}

export const Build: React.FC<BuildProps> = ({ context }) => {
	const { currentProjectPath, main } = context;

	const [entrypoint, setEntrypoint] = useState<string | undefined>();

	useEffect(() => {
		resolveEntrypoint(main, currentProjectPath)
			.then(setEntrypoint)
			.catch(() => undefined);
	}, [main, currentProjectPath]);

	useBundleBuild(entrypoint, context);

	const { rootPattern: unmappedPattern, overrides } = useResolveBuild(context);

	const { rootPattern, outputs, injectedNodes, injectedUnits, injectedPatterns } = useMapGraph(unmappedPattern);

	const { arrangement, tempoMap } = useBuildArrangement(rootPattern);

	const setup = useSetupPlayback(rootPattern, main);

	const buildContext = useMemo((): BuildContext | undefined => {
		if (!setup) return undefined;

		const { audioContext, playbackEngine, unitDriverMap } = setup;

		return {
			...context,
			arrangement,
			audioContext,
			injectedNodes,
			injectedPatterns,
			injectedUnits,
			overrides,
			playbackEngine,
			rootPattern,
			outputs,
			tempoMap,
			unitDriverMap,
		};
	}, [context, arrangement, tempoMap, injectedNodes, injectedPatterns, injectedUnits, outputs, overrides, rootPattern, setup]);

	if (!buildContext)
		return (
			<div className="flex flex-1 items-center justify-center">
				<LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);

	return <BuildLayout context={buildContext} />;
};
