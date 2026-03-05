import { useEffect } from "react";
import type { BuildContext } from "../../../../../models/Context";

export function useMuteSolo(context: BuildContext): void {
	const { project, injectedUnits, unitDriverMap } = context;

	useEffect(() => {
		const hasSolo = project.soloedOutputs.size > 0;

		for (const [key] of injectedUnits) {
			if (!key.endsWith(".router.analyser")) continue;

			// FIX: Use useOutputs to get the list of outputs, what you are doing here is weird. Better yet, the caller already has the outputs, pass them in
			const outputId = key.replace("system.", "").replace(".router.analyser", "");
			const isMuted = project.mutedOutputs.has(outputId);
			const isSoloed = project.soloedOutputs.has(outputId);

			const shouldPlay = hasSolo ? isSoloed : !isMuted;
			const targetValue = shouldPlay ? 0.5 : 0;

			for (const [gainKey] of injectedUnits) {
				if (!gainKey.startsWith(`system.${outputId}.router.gain.`)) continue;

				const driverPath = `${gainKey}.level`;
				const driver = unitDriverMap.all.get(driverPath);

				if (driver) {
					driver.offset.value = targetValue;
				}
			}
		}
	}, [project.mutedOutputs, project.soloedOutputs, injectedUnits, unitDriverMap]);
}
