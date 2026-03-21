import type { UnitContext } from "../context";
import { Unit, type SetupResult, type UnitInput, type UnitProperties } from "../unit";
import { filter, type FilterEffectUnit } from "./filter";
import { chain } from "../composites/chain";

export interface DeHumProperties extends UnitProperties {
	readonly frequency: 50 | 60;
	readonly harmonics: number;
	readonly resonance: number;
	readonly previousProperties?: DeHumProperties;
}

export class DeHumEffectUnit extends Unit {
	readonly type = ["unit", "de-hum"] as const;

	static override is(value: unknown): value is DeHumEffectUnit {
		return Unit.is(value) && value.type[1] === "de-hum";
	}

	declare readonly properties: DeHumProperties;

	private filterChain: Unit | undefined;

	constructor(properties: UnitInput<DeHumProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get frequency(): 50 | 60 { return this.properties.frequency; }
	get harmonics(): number { return this.properties.harmonics; }
	get resonance(): number { return this.properties.resonance; }

	clone(overrides?: Partial<DeHumProperties>): DeHumEffectUnit {
		return new DeHumEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const notchCount = this.harmonics + 1;
		const notches: Array<FilterEffectUnit> = [];

		for (let harmonic = 1; harmonic <= notchCount; harmonic++) {
			notches.push(
				filter({
					mode: "notch",
					frequency: this.frequency * harmonic,
					resonance: this.resonance,
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
