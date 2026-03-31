import type { AnyUnit, SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { CompositeUnit, MidiUnit } from "@resequence/web-au-core";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import { z } from "zod";

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
	const targets: Array<AnyUnit> = [...unit.targets];

	unit.targets.length = 0;

	if (unit instanceof CompositeUnit) {
		const tail = "tail" in unit ? (unit as { tail: AnyUnit }).tail : undefined;

		if (tail) {
			for (const target of tail.targets) {
				if (!targets.includes(target)) targets.push(target);
			}

			tail.targets.length = 0;
		}
	}

	return new BypassUnit({ inner: unit, targets });
}
