import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";

export interface RingModProperties extends UnitProperties {
	readonly carrier: Unit;
}

export class RingModEffectUnit extends Unit {
	readonly type = ["unit", "ringmod"] as const;
	declare readonly properties: RingModProperties;

	static override is(value: unknown): value is RingModEffectUnit {
		return Unit.is(value) && value.type[1] === "ringmod";
	}

	constructor(properties: UnitInput<RingModProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get carrier(): Unit { return this.properties.carrier; }

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
