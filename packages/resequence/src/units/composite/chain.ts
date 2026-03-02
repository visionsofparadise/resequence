import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult, Unit } from "../unit";
import { Composite, flattenUnits } from "./composite";

export class Chain extends Composite {
	readonly type = ["unit", "composite", "chain"] as const;

	static is(value: unknown): value is Chain {
		return Composite.is(value) && value.type[2] === "chain";
	}

	readonly head: Unit;
	readonly tail: Unit;
	readonly units: ReadonlyArray<Unit>;

	constructor(...inputUnits: Array<Unit>) {
		super();

		for (let index = 0; index < inputUnits.length - 1; index++) {
			const current = inputUnits[index];
			const next = inputUnits[index + 1];

			if (current && next) current.to(next);
		}

		this.units = flattenUnits(inputUnits);

		const first = this.units[0];
		const last = this.units[this.units.length - 1];

		if (!first || !last) throw new Error("chain() requires at least one unit");

		this.head = first;
		this.tail = last;
	}

	to(unit: Unit): void {
		this.tail.to(unit);
	}

	protected _setup(_context: ScheduleContext): SetupResult {
		return { entries: [this.head], exits: [this.tail] };
	}

	protected _teardown(context: ScheduleContext): void {
		this.head.teardown(context);
	}
}

export function chain(...units: Array<Unit>): Chain {
	return new Chain(...units);
}
