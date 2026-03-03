import type { ScheduleContext } from "../../rendering/schedule-context";
import { linearGain } from "../effects/gain";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import type { Unit } from "../unit";
import { Composite, flattenUnits } from "./composite";

export interface FanProperties extends UnitProperties {
	readonly branches: ReadonlyArray<Unit>;
}

export class Fan extends Composite {
	readonly type = ["unit", "composite", "fan"] as const;
	readonly properties: FanProperties;

	static is(value: unknown): value is Fan {
		return Composite.is(value) && value.type[2] === "fan";
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

	to(unit: Unit): void {
		for (const tail of this.tails) {
			tail.to(unit);
		}
	}

	protected _setup(_context: ScheduleContext): SetupResult {
		return { entries: [this.head], exits: [...this.tails] };
	}

	protected _teardown(context: ScheduleContext): void {
		this.head.teardown(context);
	}
}

export function fan(...units: Array<Unit>): Fan {
	return new Fan({ branches: units });
}
