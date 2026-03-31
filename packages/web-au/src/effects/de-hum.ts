import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { filter, type FilterEffectUnit } from "./filter";
import { chain } from "../composites/chain";

const deHumSchema = z.object({
	frequency: z.number().default(60).describe("Hum Frequency"),
	harmonics: z.number().min(0).max(10).default(4).describe("Harmonics"),
	resonance: z.number().min(0).max(30).default(30).describe("Resonance"),
});

export class DeHumEffectUnit extends Unit<typeof deHumSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "de-hum";

	private filterChain: Unit | undefined;

	constructor(input: z.infer<typeof deHumSchema> & UnitInput) {
		super(input, deHumSchema);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const notchCount = this.parameters.harmonics.value + 1;
		const notches: Array<FilterEffectUnit> = [];

		for (let harmonic = 1; harmonic <= notchCount; harmonic++) {
			notches.push(
				filter({
					mode: "notch",
					frequency: (this.parameters.frequency.value as 50 | 60) * harmonic,
					resonance: this.parameters.resonance.value,
				}),
			);
		}

		const filterChain = chain(...notches);

		this.filterChain = filterChain;

		return { entries: [filterChain], exits: [filterChain] };
	}

	protected override _teardown(context: UnitContext): void {
		this.filterChain?.teardown(context);
		this.filterChain = undefined;
	}
}

export function deHum(options?: {
	frequency?: 50 | 60;
	harmonics?: number;
	resonance?: number;
	id?: string;
}): DeHumEffectUnit {
	return new DeHumEffectUnit({
		frequency: options?.frequency ?? 60,
		harmonics: options?.harmonics ?? 4,
		resonance: options?.resonance ?? 30,
		id: options?.id,
	});
}
