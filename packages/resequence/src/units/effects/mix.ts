import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit, type SetupResult } from "../unit";
import { gain } from "./gain";

export class MixNode extends Unit {
	readonly id: string | undefined;
	private dryChain: Unit | undefined;

	constructor(
		private readonly inner: Unit,
		private readonly amount: number,
		id?: string,
	) {
		super();

		this.id = id;
	}

	protected _setup(_context: ScheduleContext): SetupResult {
		const wetGainUnit = gain({
			level: linearToDb(this.amount),
			id: this.id ? `${this.id}.wet` : undefined,
		});

		this.inner.to(wetGainUnit);

		const dryChain = gain({
			level: linearToDb(1 - this.amount),
			id: this.id ? `${this.id}.dry` : undefined,
		});
		this.dryChain = dryChain;

		return { entries: [this.inner, dryChain], exits: [wetGainUnit, dryChain] };
	}

	protected _teardown(context: ScheduleContext): void {
		this.inner.teardown(context);
		this.dryChain?.teardown(context);
		this.dryChain = undefined;
	}
}

export function mix(inner: Unit, amount: number, id?: string): MixNode {
	return new MixNode(inner, amount, id);
}

function linearToDb(linear: number): number {
	return 20 * Math.log10(Math.max(linear, 1e-5));
}
