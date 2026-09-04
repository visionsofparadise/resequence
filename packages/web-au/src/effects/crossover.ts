import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { type GainEffectUnit, linearGain } from "./gain";
import { linkwitzRiley } from "./linkwitz-riley";
import type { AnyUnit, SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

const crossoverSchema = z.object({
	bands: z.array(
		z.object({
			frequency: z.number().min(20).max(20000).describe("Crossover Frequency").optional(),
		}),
	),
});

export class CrossoverEffectUnit extends Unit<typeof crossoverSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "crossover";
	readonly bands: Array<GainEffectUnit> = [];
	private bandNodes: Array<Array<AnyUnit>> = [];

	constructor(input: z.infer<typeof crossoverSchema> & UnitInput) {
		super(input, crossoverSchema);

		for (const _band of this.parameters.bands) {
			this.bands.push(linearGain({ level: 1 }));
		}
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const inputUnit = linearGain({ level: 1 });
		const mergerUnit = linearGain({ level: 1 });

		for (let bandIndex = 0; bandIndex < this.parameters.bands.length; bandIndex++) {
			const bandParam = this.parameters.bands[bandIndex];
			const bandGain = this.bands[bandIndex];

			if (!bandParam || !bandGain) continue;

			const nodes: Array<AnyUnit> = [];
			let bandHead: AnyUnit = inputUnit;

			if (bandIndex > 0) {
				const prevBand = this.parameters.bands[bandIndex - 1];
				const prevFreq = prevBand?.frequency?.value;

				if (prevFreq !== undefined) {
					const hp = linkwitzRiley(prevFreq, "highpass");

					inputUnit.to(hp);
					bandHead = hp;
					nodes.push(hp);
				}
			}

			const freq = bandParam.frequency?.value;

			if (freq !== undefined) {
				const lp = linkwitzRiley(freq, "lowpass");

				bandHead.to(lp);
				bandHead = lp;
				nodes.push(lp);
			} else if (bandHead === inputUnit && bandIndex > 0) {
				const prevBand = this.parameters.bands[bandIndex - 1];
				const prevFreq = prevBand?.frequency?.value;

				if (prevFreq !== undefined) {
					const hp = linkwitzRiley(prevFreq, "highpass");

					inputUnit.to(hp);
					bandHead = hp;
					nodes.push(hp);
				}
			}

			bandHead.to(bandGain);
			bandGain.to(mergerUnit);
			nodes.push(bandGain);

			this.bandNodes.push(nodes);
		}

		await inputUnit.setup(context);

		return { entries: [inputUnit], exits: [mergerUnit] };
	}

	protected override _teardown(context: UnitContext): void {
		for (const nodes of this.bandNodes) {
			for (const node of nodes) node.teardown(context);
		}

		this.bandNodes = [];
	}
}

export function crossover(bands: Array<{ frequency?: number }>): CrossoverEffectUnit {
	return new CrossoverEffectUnit({ bands: bands.map((band) => ({ frequency: band.frequency })) });
}

export const multiband = crossover;
