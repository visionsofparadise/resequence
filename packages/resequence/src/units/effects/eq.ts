import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit, type SetupResult } from "../unit";
import { filter, type FilterEffectUnit, type FilterMode } from "./filter";

export interface EqBand {
	readonly type: FilterMode;
	readonly frequency: number;
	readonly gain?: number;
	readonly resonance?: number;
	readonly id?: string;
}

export class EqEffectUnit extends Unit {
	private readonly bands: ReadonlyArray<EqBand>;
	public readonly id?: string;

	private filterChain: Array<FilterEffectUnit> = [];

	constructor({ bands, id }: { bands: ReadonlyArray<EqBand>; id?: string }) {
		super();
		this.bands = bands;
		this.id = id;
	}

	protected _setup(_context: ScheduleContext): SetupResult {
		const filters: Array<FilterEffectUnit> = [];

		for (const band of this.bands) {
			filters.push(filter({ mode: band.type, frequency: band.frequency, resonance: band.resonance, gain: band.gain, id: band.id }));
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

	protected _teardown(context: ScheduleContext): void {
		this.filterChain[0]?.teardown(context);
		this.filterChain = [];
	}
}

export function eq({ bands, id }: { bands: ReadonlyArray<EqBand>; id?: string }): EqEffectUnit {
	return new EqEffectUnit({ bands, id });
}
