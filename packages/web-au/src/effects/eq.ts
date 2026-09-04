import { Unit, type Parameter } from "@resequence/web-au-core";
import { z } from "zod";
import { filter, type FilterEffectUnit, type FilterMode } from "./filter";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

export interface EqBand {
	readonly type: FilterMode;
	readonly frequency: number;
	readonly gain?: number;
	readonly resonance?: number;
	readonly id?: string;
}

const eqSchema = z.object({
	bands: z
		.array(
			z.object({
				type: z
					.enum(["lowpass", "highpass", "bandpass", "notch", "allpass", "peaking", "lowshelf", "highshelf"])
					.default("peaking"),
				frequency: z.number().min(20).max(20000).default(1000),
				gain: z.number().min(-40).max(40).default(0).optional(),
				resonance: z.number().min(0).max(30).default(1).optional(),
				id: z.string().optional(),
			}),
		)
		.default([]),
});

export class EqEffectUnit extends Unit<typeof eqSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "eq";

	private filterChain: Array<FilterEffectUnit> = [];

	constructor(input: z.infer<typeof eqSchema> & UnitInput) {
		super(input, eqSchema);
	}

	get bands(): ReadonlyArray<EqBand> {
		return this.parameters.bands.map(
			(band: {
				type: Parameter<FilterMode>;
				frequency: Parameter<number>;
				gain: Parameter<number> | null;
				resonance: Parameter<number> | null;
				id: Parameter<string> | null;
			}) => ({
				type: band.type.value,
				frequency: band.frequency.value,
				gain: band.gain?.value,
				resonance: band.resonance?.value,
				id: band.id?.value,
			}),
		);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const filters: Array<FilterEffectUnit> = [];

		for (const band of this.bands) {
			filters.push(
				filter({
					mode: band.type,
					frequency: band.frequency,
					resonance: band.resonance,
					gain: band.gain,
					id: band.id,
				}),
			);
		}

		for (let index = 0; index < filters.length - 1; index++) {
			const current = filters[index];
			const next = filters[index + 1];

			if (current && next) current.to(next);
		}

		const firstFilter = filters[0];
		const lastFilter = filters[filters.length - 1];

		if (!firstFilter || !lastFilter) return {};

		this.filterChain = filters;

		return { entries: [firstFilter], exits: [lastFilter] };
	}

	protected override _teardown(context: UnitContext): void {
		this.filterChain[0]?.teardown(context);
		this.filterChain = [];
	}
}

export function eq({ bands, id }: { bands: ReadonlyArray<EqBand>; id?: string }): EqEffectUnit {
	return new EqEffectUnit({ bands: [...bands], id });
}
