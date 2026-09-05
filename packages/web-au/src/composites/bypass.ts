import { MidiUnit } from "@resequence/web-au-core";
import { z } from "zod";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import { detachTargets } from "./utils/detachTargets";
import type { AnyUnit, SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

export class BypassUnit extends MidiUnit {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "bypass";

	readonly inner: AnyUnit;
	private passthrough: GainEffectUnit | undefined;

	constructor(input: { inner: AnyUnit; targets?: Array<AnyUnit> } & UnitInput) {
		super(input, z.object({}));
		this.inner = input.inner;

		if (input.targets) this.targets.push(...input.targets);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const passthrough = linearGain({ level: 1 });

		this.passthrough = passthrough;

		await this.inner.setup(context);

		return { entries: [passthrough], exits: [passthrough] };
	}

	protected override _teardown(context: UnitContext): void {
		this.inner.teardown(context);
		this.passthrough?.teardown(context);
		this.passthrough = undefined;
	}
}

export function bypass(unit: AnyUnit): BypassUnit {
	const targets = detachTargets(unit);

	return new BypassUnit({ inner: unit, targets });
}
