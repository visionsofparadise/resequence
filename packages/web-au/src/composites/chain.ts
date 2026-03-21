import type { UnitContext } from "../context";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import type { Unit } from "../unit";
import { Composite, flattenUnits } from "./composite";

export interface ChainProperties extends UnitProperties {
	readonly units: ReadonlyArray<Unit>;
}

export class Chain extends Composite {
	readonly type = ["unit", "composite", "chain"] as const;
	declare readonly properties: ChainProperties;

	static override is(value: unknown): value is Chain {
		return Composite.is(value) && value.type[2] === "chain";
	}

	readonly head: Unit;
	readonly tail: Unit;

	get units(): ReadonlyArray<Unit> { return this.properties.units; }

	constructor(properties: UnitInput<ChainProperties>) {
		super(properties);
		const units = [...properties.units];

		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [], units };
		const firstUnit = units[0];
		const last = units[units.length - 1];

		if (!firstUnit || !last) throw new Error("chain() requires at least one unit");
		this.head = firstUnit;
		this.tail = last;
	}

	clone(overrides?: Partial<ChainProperties>): Chain {
		return new Chain({ ...this.properties, ...overrides });
	}

	override to(unit: Unit): void {
		this.tail.to(unit);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		return { entries: [this.head], exits: [this.tail] };
	}

	protected override _teardown(context: UnitContext): void {
		this.head.teardown(context);
	}
}

export function chain(...inputUnits: Array<Unit>): Chain {
	for (let index = 0; index < inputUnits.length - 1; index++) {
		const current = inputUnits[index];
		const next = inputUnits[index + 1];

		if (current && next) current.to(next);
	}

	return new Chain({ units: flattenUnits(inputUnits) });
}
