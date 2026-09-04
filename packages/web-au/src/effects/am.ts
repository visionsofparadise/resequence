import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import type { SetupResult, UnitContext, UnitInput, AnyUnit } from "@resequence/web-au-core";

export class AmEffectUnit extends Unit {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "am";

	readonly carrier: AnyUnit;
	private dcOffsetNode: ConstantSourceNode | undefined;

	constructor(input: UnitInput & { readonly carrier: AnyUnit }) {
		super(input, z.object({}));
		this.carrier = input.carrier;
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const modulatorGain = context.audioContext.createGain();

		modulatorGain.gain.value = 0;

		await this.carrier.setup(context);

		const carrierScale = context.audioContext.createGain();

		carrierScale.gain.value = 0.5;

		const dcOffset = context.audioContext.createConstantSource();

		dcOffset.offset.value = 0.5;
		dcOffset.start();

		for (const exit of this.carrier.exitNodes) {
			exit.connect(carrierScale);
		}

		carrierScale.connect(modulatorGain.gain);
		dcOffset.connect(modulatorGain.gain);

		this.dcOffsetNode = dcOffset;

		return { entries: [modulatorGain], exits: [modulatorGain] };
	}

	protected override _teardown(context: UnitContext): void {
		this.dcOffsetNode?.stop();
		this.dcOffsetNode?.disconnect();
		this.dcOffsetNode = undefined;
		this.carrier.teardown(context);
	}
}

export function am(carrier: Unit): AmEffectUnit {
	return new AmEffectUnit({ carrier });
}
