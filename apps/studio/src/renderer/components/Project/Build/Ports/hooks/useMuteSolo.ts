import { useEffect } from "react";
import type { BuildContext } from "../../../../../models/Context";

export function useMuteSolo(context: BuildContext): void {
	const { project, router, injectedUnits, unitDriverMap } = context;

	useEffect(() => {
		const hasSolo = project.soloedOutputs.size > 0;

		for (const [portKey] of router.ports) {
			const isMuted = project.mutedOutputs.has(portKey);
			const isSoloed = project.soloedOutputs.has(portKey);

			const shouldPlay = hasSolo ? isSoloed : !isMuted;
			const targetValue = shouldPlay ? 0.5 : 0;

			for (const [gainKey] of injectedUnits) {
				if (!gainKey.startsWith(`system.${portKey}.gain.`)) continue;

				const driverPath = `${gainKey}.level`;
				const driver = unitDriverMap.all.get(driverPath);

				if (driver) {
					driver.offset.value = targetValue;
				}
			}
		}
	}, [project.mutedOutputs, project.soloedOutputs, router, injectedUnits, unitDriverMap]);
}
