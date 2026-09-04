import { useEffect, useMemo, useState } from "react";
import { resolveEntrypoint } from "@/renderer/utils/resolveEntrypoint";
import { TransportBar } from "../../TransportBar";
import { useBuildArrangement } from "./hooks/useBuildArrangement";
import { useBundleBuild } from "./hooks/useBundle";
import { useModifyGraph } from "./hooks/useModifyGraph";
import { useResolveBuild } from "./hooks/useResolve";
import { useSetupPlayback } from "./hooks/useSetup";
import { createPortColorMap } from "./utils/outputColor";
import { Workspace } from "./Workspace";
import type { BuildContext, ProjectContext } from "../../../models/Context";

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

	const { router, overrides } = useResolveBuild(context);
	const { injectedNodes, injectedUnits } = useModifyGraph(router);
	const { arrangement, tempoMap } = useBuildArrangement(router);

	const setup = useSetupPlayback(router, main);

	const portColorMap = useMemo(() => createPortColorMap([...router.ports.keys()]), [router]);

	const buildContext = useMemo((): BuildContext | undefined => {
		if (!setup) return undefined;

		const { audioContext, playbackEngine, unitDriverMap } = setup;

		return {
			...context,
			arrangement,
			audioContext,
			injectedNodes,
			injectedUnits,
			overrides,
			playbackEngine,
			portColorMap,
			router,
			tempoMap,
			unitDriverMap,
		};
	}, [context, arrangement, tempoMap, injectedNodes, injectedUnits, overrides, portColorMap, router, setup]);

	if (!buildContext)
		return (
			<div className="flex flex-1 h-full items-center justify-center">
				<span className="type-label text-text-secondary animate-pulse">Loading...</span>
			</div>
		);

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 min-h-0">
				<Workspace context={buildContext} />
			</div>
			<TransportBar context={buildContext} />
		</div>
	);
};
