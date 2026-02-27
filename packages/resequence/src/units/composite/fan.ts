import type { ScheduleContext } from "../../rendering/schedule-context";
import { linearGain } from "../effects/gain";
import type { Unit } from "../unit";
import { Composite, flattenUnits } from "./composite";

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

export function fan(...units: Array<Unit>): Fan {
	return new Fan(units);
}
