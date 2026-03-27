import type { Unit } from "@resequence/web-au";
import { SpeakersUnit, analyser, linearGain, mapUnits } from "@resequence/web-au";
import { useMemo } from "react";
import type { Router } from "resequence";

export interface InjectResult {
	readonly injectedNodes: WeakSet<object>;
	readonly injectedUnits: Map<string, Unit>;
}

export function useMapGraph(router: Router): InjectResult {
	return useMemo(() => {
		const injectedNodes = new WeakSet();
		const injectedUnits = new Map<string, Unit>();

		for (const [portKey, unit] of router.ports) {
			const portAnalyser = analyser({ fftSize: 256 });

			injectedNodes.add(portAnalyser);
			injectedUnits.set(`system.${portKey}.analyser`, portAnalyser);

			let gainIndex = 0;

			// FIX: We need to use the transformed unit graphs, we treat them as immutable
			mapUnits(unit, (node) => {
				if (SpeakersUnit.is(node)) {
					const gainId = `system.${portKey}.gain.${gainIndex++}`;
					const channelGain = linearGain({ level: 1, id: gainId });

					channelGain.to(node);
					channelGain.to(portAnalyser);

					injectedNodes.add(channelGain);
					injectedUnits.set(gainId, channelGain);

					return channelGain;
				}

				return node;
			});
		}

		return { injectedNodes, injectedUnits };
	}, [router]);
}
