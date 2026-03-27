import type { SetupResult, Unit, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { linearGain } from "../effects/gain";

import { CompositeUnit, flattenUnits } from "@resequence/web-au-core";

export interface FanProperties extends UnitProperties {
	readonly branches: ReadonlyArray<Unit>;
}

export class Fan extends CompositeUnit {
	readonly type = ["unit", "composite", "fan"] as const;
	declare readonly properties: FanProperties;

	static override is(value: unknown): value is Fan {
		return CompositeUnit.is(value) && value.type[2] === "fan";
	}

	readonly head: Unit;
	readonly tails: ReadonlyArray<Unit>;
	readonly units: ReadonlyArray<Unit>;

	constructor(properties: UnitInput<FanProperties>) {
		super(properties);
		const branches = properties.branches;

		this.head = linearGain({ level: 1 });
		for (const branch of branches) {
			this.head.to(branch);
		}

		this.tails = [...branches];
		this.units = [this.head, ...flattenUnits(branches)];
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	clone(overrides?: Partial<FanProperties>): Fan {
		return new Fan({ ...this.properties, ...overrides });
	}

	override to(unit: Unit): void {
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

export function fan(...units: Array<Unit>): Fan {
	return new Fan({ branches: units });
}
