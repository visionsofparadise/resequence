import type { ScheduleContext } from "../rendering/schedule-context";
import { linearGain } from "./effects/gain";
import { Unit } from "./unit";

function flattenUnits(units: ReadonlyArray<Unit>): ReadonlyArray<Unit> {
	return units.flatMap((unit) => (unit instanceof Composite ? unit.units : [unit]));
}

// FIX: Create a composite folder, then break out chain and fan into their own files
export abstract class Composite extends Unit {
	readonly id = undefined;
	abstract readonly head: Unit;
	abstract readonly units: ReadonlyArray<Unit>;
}

export class Chain extends Composite {
	readonly head: Unit;
	readonly tail: Unit;
	readonly units: ReadonlyArray<Unit>;
	protected readonly innerUnits: ReadonlyArray<Unit>;

	// FIX: Can units be spread here?
	constructor(inputUnits: ReadonlyArray<Unit>) {
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
		this.innerUnits = [this.head];
	}

	to(unit: Unit): void {
		this.tail.to(unit);
	}

	protected _setup(context: ScheduleContext): void {
		this.head.setup(context);
		this.entryNodes.push(...this.head.entryNodes);
		this.exitNodes.push(...this.tail.exitNodes);
	}

	protected _teardown(context: ScheduleContext): void {
		this.head.teardown(context);
	}
}

export class Fan extends Composite {
	readonly head: Unit;
	readonly tails: ReadonlyArray<Unit>;
	readonly units: ReadonlyArray<Unit>;
	protected readonly innerUnits: ReadonlyArray<Unit>;

	constructor(branches: ReadonlyArray<Unit>) {
		super();

		this.head = linearGain({ level: 1 });

		for (const branch of branches) {
			this.head.to(branch);
		}

		this.tails = [...branches];
		this.units = [this.head, ...flattenUnits(branches)];
		this.innerUnits = [this.head];
	}

	to(unit: Unit): void {
		for (const tail of this.tails) {
			tail.to(unit);
		}
	}

	protected _setup(context: ScheduleContext): void {
		this.head.setup(context);
		this.entryNodes.push(...this.head.entryNodes);
		for (const tail of this.tails) {
			this.exitNodes.push(...tail.exitNodes);
		}
	}

	protected _teardown(context: ScheduleContext): void {
		this.head.teardown(context);
	}
}

export function chain(...units: Array<Unit>): Chain {
	return new Chain(units);
}

export function fan(...units: Array<Unit>): Fan {
	return new Fan(units);
}
