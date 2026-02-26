import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit } from "../unit";
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

	protected _setup(context: ScheduleContext): void {
		const wetGainUnit = gain({
			level: linearToDb(this.amount),
			id: this.id ? `${this.id}.wet` : undefined,
		});

		this.inner.to(wetGainUnit);
		for (const target of this.targets) wetGainUnit.to(target);
		this.inner.setup(context);

		this.dryChain = gain({
			level: linearToDb(1 - this.amount),
			id: this.id ? `${this.id}.dry` : undefined,
		});

		for (const target of this.targets) this.dryChain.to(target);
		this.dryChain.setup(context);

		this.entryNodes.push(...this.inner.entryNodes, ...this.dryChain.entryNodes);
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
