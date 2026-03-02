import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit, type SetupResult } from "../unit";

export class RingModEffectUnit extends Unit {
	readonly type = ["unit", "ringmod"] as const;
	readonly id = undefined;

	static is(value: unknown): value is RingModEffectUnit {
		return Unit.is(value) && value.type[1] === "ringmod";
	}

	public readonly carrier: Unit;

	constructor(carrier: Unit) {
		super();
		this.carrier = carrier;
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
	return new RingModEffectUnit(carrier);
}
