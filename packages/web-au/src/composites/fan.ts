import type { AnyUnit, SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { linearGain } from "../effects/gain";
import { CompositeUnit, flattenUnits } from "@resequence/web-au-core";
import { z } from "zod";

export class Fan extends CompositeUnit {
	readonly type = ["unit", "composite", "fan"] as const;

	static override is(value: unknown): value is Fan {
		return CompositeUnit.is(value) && value.type[2] === "fan";
	}

	readonly head: AnyUnit;
	readonly tails: ReadonlyArray<AnyUnit>;
	readonly units: ReadonlyArray<AnyUnit>;

	constructor(input: { branches: ReadonlyArray<AnyUnit> } & UnitInput) {
		super(input, z.object({}));
		const branches = input.branches;

		this.head = linearGain({ level: 1 });
		for (const branch of branches) {
			this.head.to(branch);
		}

		this.tails = [...branches];
		this.units = [this.head, ...flattenUnits(branches)];
	}

	override to(unit: AnyUnit): void {
		for (const tail of this.tails) {
			tail.to(unit);
		}
	}

	protected override _setup(_context: UnitContext): SetupResult {
		return { entries: [this.head], exits: [...this.tails] };
	}

	protected override _teardown(context: UnitContext): void {
		this.head.teardown(context);
	}
}

export function fan(...units: Array<AnyUnit>): Fan {
	return new Fan({ branches: units });
}
