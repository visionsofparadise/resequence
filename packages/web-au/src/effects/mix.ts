import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { gain } from "./gain";

export interface MixProperties extends UnitProperties {
	readonly inner: Unit;
	readonly amount: number;
}

export class MixNode extends Unit {
	readonly type = ["unit", "mix"] as const;

	static override is(value: unknown): value is MixNode {
		return Unit.is(value) && value.type[1] === "mix";
	}

	declare readonly properties: MixProperties;
	private dryChain: Unit | undefined;

	constructor(properties: UnitInput<MixProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get inner(): Unit { return this.properties.inner; }
	get amount(): number { return this.properties.amount; }

	protected override _setup(_context: UnitContext): SetupResult {
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

	protected override _teardown(context: UnitContext): void {
		this.inner.teardown(context);
		this.dryChain?.teardown(context);
		this.dryChain = undefined;
	}
}

export function mix(inner: Unit, amount: number, id?: string): MixNode {
	return new MixNode({ inner, amount, id });
}

function linearToDb(linear: number): number {
	return 20 * Math.log10(Math.max(linear, 1e-5));
}
