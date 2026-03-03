import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit, type SetupResult, type UnitInput, type UnitProperties } from "../unit";

export interface RingModProperties extends UnitProperties {
	readonly carrier: Unit;
}

export class RingModEffectUnit extends Unit {
	readonly type = ["unit", "ringmod"] as const;
	readonly properties: RingModProperties;

	static is(value: unknown): value is RingModEffectUnit {
		return Unit.is(value) && value.type[1] === "ringmod";
	}

	constructor(properties: UnitInput<RingModProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get carrier(): Unit { return this.properties.carrier; }

	clone(overrides?: Partial<RingModProperties>): RingModEffectUnit {
		return new RingModEffectUnit({ ...this.properties, ...overrides });
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		const modulatorGain = context.audioContext.createGain();
		modulatorGain.gain.value = 0;

		await this.carrier.setup(context);

		for (const exit of this.carrier.exitNodes) {
			exit.connect(modulatorGain.gain);
		}

		return { entries: [modulatorGain], exits: [modulatorGain] };
	}

	protected _teardown(context: ScheduleContext): void {
		this.carrier.teardown(context);
	}
}

export function ringmod(carrier: Unit): RingModEffectUnit {
	return new RingModEffectUnit({ carrier });
}
