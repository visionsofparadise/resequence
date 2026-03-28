import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";

import { Unit } from "@resequence/web-au-core";
import { type FilterEffectUnit, filter } from "./filter";

export interface LinkwitzRileyProperties extends UnitProperties {
	readonly frequency: number;
	readonly filterType: "lowpass" | "highpass";
}

export class LinkwitzRileyUnit extends Unit {
	readonly type = ["unit", "linkwitz-riley"] as const;
	declare readonly properties: LinkwitzRileyProperties;

	static override is(value: unknown): value is LinkwitzRileyUnit {
		return Unit.is(value) && value.type[1] === "linkwitz-riley";
	}

	private filters: Array<FilterEffectUnit> = [];

	constructor(properties: UnitInput<LinkwitzRileyProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get frequency(): number { return this.properties.frequency; }
	get filterType(): "lowpass" | "highpass" { return this.properties.filterType; }

	protected override _setup(): SetupResult {
		const first = filter({ mode: this.filterType, frequency: this.frequency, resonance: 0.707 });
		const second = filter({ mode: this.filterType, frequency: this.frequency, resonance: 0.707 });

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
