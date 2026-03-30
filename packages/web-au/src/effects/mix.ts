import type { SetupResult, UnitContext, UnitInput, AnyUnit } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { gain } from "./gain";

const mixSchema = z.object({
	amount: z.number().min(0).max(1).default(0.5).describe("Amount"),
});

export class MixNode extends Unit<typeof mixSchema> {
	readonly type = ["unit", "mix"] as const;

	static override is(value: unknown): value is MixNode {
		return Unit.is(value) && value.type[1] === "mix";
	}


	readonly inner: AnyUnit;
	private dryChain: Unit | undefined;

	constructor(input: z.infer<typeof mixSchema> & UnitInput & { readonly inner: AnyUnit }) {
		super(input, mixSchema);
		this.inner = input.inner;
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const wetGainUnit = gain({
			level: linearToDb(this.parameters.amount.value),
			id: this.id ? `${this.id}.wet` : undefined,
		});

		this.inner.to(wetGainUnit);

		const dryChain = gain({
			level: linearToDb(1 - this.parameters.amount.value),
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
