import type { ScheduleContext } from "../../rendering/schedule-context";
import { linearGain } from "../effects/gain";
import type { SetupResult, Unit } from "../unit";
import { Composite, flattenUnits } from "./composite";

export class Fan extends Composite {
	readonly type = ["unit", "composite", "fan"] as const;

	static is(value: unknown): value is Fan {
		return Composite.is(value) && value.type[2] === "fan";
	}

	readonly head: Unit;
	readonly tails: ReadonlyArray<Unit>;
	readonly units: ReadonlyArray<Unit>;

	constructor(branches: ReadonlyArray<Unit>) {
		super();

		this.head = linearGain({ level: 1 });

		for (const branch of branches) {
			this.head.to(branch);
		}

		this.tails = [...branches];
		this.units = [this.head, ...flattenUnits(branches)];
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
	return new Fan(units);
}
