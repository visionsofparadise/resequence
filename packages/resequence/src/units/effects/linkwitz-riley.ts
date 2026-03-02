import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";
import { type FilterEffectUnit, filter } from "./filter";

export class LinkwitzRileyUnit extends Unit {
	readonly type = ["unit", "linkwitz-riley"] as const;

	static is(value: unknown): value is LinkwitzRileyUnit {
		return Unit.is(value) && value.type[1] === "linkwitz-riley";
	}

	private filters: Array<FilterEffectUnit> = [];

	constructor(
		private readonly frequency: number,
		private readonly filterType: "lowpass" | "highpass",
	) {
		super();
	}

	protected _setup(): SetupResult {
		const first = filter({ mode: this.filterType, frequency: this.frequency, resonance: 0.707 });
		const second = filter({ mode: this.filterType, frequency: this.frequency, resonance: 0.707 });
		first.to(second);
		this.filters = [first, second];
		return { entries: [first], exits: [second] };
	}

	protected _teardown(context: ScheduleContext): void {
		for (const unit of this.filters) unit.teardown(context);
		this.filters = [];
	}
}

export function linkwitzRiley(frequency: number, type: "lowpass" | "highpass"): LinkwitzRileyUnit {
	return new LinkwitzRileyUnit(frequency, type);
}
