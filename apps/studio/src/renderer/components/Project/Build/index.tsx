import { resolveEntrypoint } from "@/renderer/utils/resolveEntrypoint";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuildContext, ProjectContext } from "../../../models/Context";
import { useBundleBuild } from "./hooks/useBundle";
import { useProcessPatternsA, useProcessPatternsB } from "./hooks/useProcessPatterns";
import { useProcessUnits } from "./hooks/useProcessUnits";
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

	const { rootPattern, overrides } = useResolveBuild(context);
	const { rootUnit } = useProcessPatternsA(rootPattern);
	useProcessUnits(rootUnit);
	const { arrangement, tempoMap } = useProcessPatternsB(rootPattern);
	const setup = useSetupPlayback(rootPattern, main);

	const buildContext = useMemo((): BuildContext | undefined => {
		if (!setup) return undefined;

		const { audioContext, playbackEngine, unitDriverMap } = setup;

		return {
			...context,
			arrangement,
			audioContext,
			overrides,
			playbackEngine,
			rootPattern,
			rootUnit,
			tempoMap,
			unitDriverMap,
		};
	}, [context, arrangement, tempoMap, overrides, rootPattern, rootUnit, setup]);

	if (!buildContext)
		return (
			<div className="flex flex-1 items-center justify-center">
				<LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);

	return <BuildLayout context={buildContext} />;
};
