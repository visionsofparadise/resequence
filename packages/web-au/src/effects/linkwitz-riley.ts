import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { type FilterEffectUnit, filter } from "./filter";

const linkwitzRileySchema = z.object({
	frequency: z.number().min(20).max(20000).default(1000).describe("Crossover Frequency"),
	filterType: z.enum(["lowpass", "highpass"]).default("lowpass").describe("Filter Type"),
});

export class LinkwitzRileyUnit extends Unit<typeof linkwitzRileySchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "linkwitz-riley";

	private filters: Array<FilterEffectUnit> = [];

	constructor(input: z.infer<typeof linkwitzRileySchema> & UnitInput) {
		super(input, linkwitzRileySchema);
	}

	protected override _setup(): SetupResult {
		const first = filter({ mode: this.parameters.filterType.value, frequency: this.parameters.frequency.value, resonance: 0.707 });
		const second = filter({ mode: this.parameters.filterType.value, frequency: this.parameters.frequency.value, resonance: 0.707 });

		first.to(second);
		this.filters = [first, second];

		return { entries: [first], exits: [second] };
	}

	protected override _teardown(context: UnitContext): void {
		for (const unit of this.filters) unit.teardown(context);
		this.filters = [];
	}
}

export function linkwitzRiley(frequency: number, type: "lowpass" | "highpass"): LinkwitzRileyUnit {
	return new LinkwitzRileyUnit({ frequency, filterType: type });
}
