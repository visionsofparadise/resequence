import { useMemo } from "react";
import { type Pattern, type Unit, type UnitPath, MidiPattern, OutUnit, analyser, linearGain, mapGraph, walkPatterns } from "resequence";

export interface OutputEntry {
	readonly path: UnitPath;
	readonly unit: Unit;
}

export interface MapGraphResult {
	readonly rootPattern: Pattern;
	readonly outputs: ReadonlyArray<OutputEntry>;
	readonly injectedNodes: WeakSet<object>;
	readonly injectedUnits: Map<string, Unit>;
	readonly injectedPatterns: Map<string, Pattern>;
}

export function useMapGraph(rootPattern: Pattern): MapGraphResult {
	return useMemo(() => {
		const injectedNodes = new WeakSet();
		const injectedUnits = new Map<string, Unit>();

		let currentAnalyser: Unit | undefined;
		let currentOutputId: string | undefined;
		let gainIndex = 0;

		const mappedPattern = mapGraph(
			rootPattern,
			(pattern) => pattern,
			(unit: Unit, context: UnitPath) => {
				let current = unit;

				if (!current.id) {
					current = current.clone({ id: `_${[context.outputIndex, ...context.unitIndexes].join("-")}` });
				}

				if (context.unitIndexes.length === 0) {
					currentOutputId = current.id ?? `output-${context.outputIndex}`;
					currentAnalyser = analyser({ fftSize: 256 });

					injectedNodes.add(currentAnalyser);
					injectedUnits.set(`system.${currentOutputId}.router.analyser`, currentAnalyser);

					gainIndex = 0;
				}

				if (OutUnit.is(current) && currentAnalyser && currentOutputId) {
					const gainId = `system.${currentOutputId}.router.gain.${gainIndex++}`;
					const channelGain = linearGain({ level: 1, id: gainId });

					channelGain.to(current);
					channelGain.to(currentAnalyser);

					injectedNodes.add(channelGain);
					injectedUnits.set(gainId, channelGain);

					return channelGain;
				}

				return current;
			},
		);

		const outputs: Array<OutputEntry> = [];

		walkPatterns(mappedPattern, (node, context) => {
			if (MidiPattern.is(node)) {
				for (const [outputIndex, output] of node.outputs.entries()) {
					outputs.push({
						path: { patternIndexes: context.path.patternIndexes, outputIndex, unitIndexes: [] },
						unit: output,
					});
				}
			}
		});

		const injectedPatterns = new Map<string, Pattern>();

		return { rootPattern: mappedPattern, outputs, injectedNodes, injectedUnits, injectedPatterns };
	}, [rootPattern]);
}
