import type { AnyUnit, SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { CompositeUnit, flattenUnits } from "@resequence/web-au-core";
import { z } from "zod";

export class Chain extends CompositeUnit {
	readonly type = ["unit", "composite", "chain"] as const;

	static override is(value: unknown): value is Chain {
		return CompositeUnit.is(value) && value.type[2] === "chain";
	}

	readonly head: AnyUnit;
	readonly tail: AnyUnit;
	readonly units: ReadonlyArray<AnyUnit>;

	constructor(input: { units: ReadonlyArray<AnyUnit> } & UnitInput) {
		super(input, z.object({}));
		const units = [...input.units];

		const firstUnit = units[0];
		const last = units[units.length - 1];

		if (!firstUnit || !last) throw new Error("chain() requires at least one unit");
		this.units = units;
		this.head = firstUnit;
		this.tail = last;
	}

	override to(unit: AnyUnit): void {
		this.tail.to(unit);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		return { entries: [this.head], exits: [this.tail] };
	}

	protected override _teardown(context: UnitContext): void {
		this.head.teardown(context);
	}
}

export function chain(...inputUnits: Array<AnyUnit>): Chain {
	for (let index = 0; index < inputUnits.length - 1; index++) {
		const current = inputUnits[index];
		const next = inputUnits[index + 1];

		if (current && next) current.to(next);
	}

	return new Chain({ units: flattenUnits(inputUnits) });
}
