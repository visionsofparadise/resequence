import type { SetupResult, UnitContext, UnitInput, AnyUnit } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";

export class RingModEffectUnit extends Unit {
	readonly type = ["unit", "ringmod"] as const;

	static override is(value: unknown): value is RingModEffectUnit {
		return Unit.is(value) && value.type[1] === "ringmod";
	}

	readonly carrier: AnyUnit;

	constructor(input: UnitInput & { readonly carrier: AnyUnit }) {
		super(input, z.object({}));
		this.carrier = input.carrier;
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const modulatorGain = context.audioContext.createGain();

		modulatorGain.gain.value = 0;

		await this.carrier.setup(context);

		for (const exit of this.carrier.exitNodes) {
			exit.connect(modulatorGain.gain);
		}

		return { entries: [modulatorGain], exits: [modulatorGain] };
	}

	protected override _teardown(context: UnitContext): void {
		this.carrier.teardown(context);
	}
}

export function ringmod(carrier: Unit): RingModEffectUnit {
	return new RingModEffectUnit({ carrier });
}
