import { MusicRebalanceTransformUnit } from "./music-rebalance";

export function dialogueIsolate(modelPath: string, options?: {
	dialogueGain?: number;
	noiseGain?: number;
	highPass?: number;
	lowPass?: number;
	id?: string;
}): MusicRebalanceTransformUnit {
	const dialogueLinear = dbToLinear(options?.dialogueGain ?? 0);
	const noiseLinear = dbToLinear(options?.noiseGain ?? -Infinity);

	return new MusicRebalanceTransformUnit({
		modelPath,
		stems: {
			vocals: dialogueLinear,
			drums: noiseLinear,
			bass: noiseLinear,
			other: noiseLinear,
		},
		highPass: options?.highPass ?? 80,
		lowPass: options?.lowPass ?? 20000,
		id: options?.id,
	});
}

function dbToLinear(db: number): number {
	if (db === -Infinity) return 0;

	return Math.pow(10, db / 20);
}
