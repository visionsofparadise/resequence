import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit, type SetupResult, type UnitInput, type UnitProperties } from "../unit";
import { filter, type FilterEffectUnit, type FilterMode } from "./filter";

export interface EqBand {
	readonly type: FilterMode;
	readonly frequency: number;
	readonly gain?: number;
	readonly resonance?: number;
	readonly id?: string;
}

export interface EqProperties extends UnitProperties {
	readonly bands: ReadonlyArray<EqBand>;
}

export class EqEffectUnit extends Unit {
	readonly type = ["unit", "eq"] as const;
	readonly properties: EqProperties;

	static is(value: unknown): value is EqEffectUnit {
		return Unit.is(value) && value.type[1] === "eq";
	}

	private filterChain: Array<FilterEffectUnit> = [];

	constructor(properties: UnitInput<EqProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get bands(): ReadonlyArray<EqBand> { return this.properties.bands; }

	clone(overrides?: Partial<EqProperties>): EqEffectUnit {
		return new EqEffectUnit({ ...this.properties, ...overrides });
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
