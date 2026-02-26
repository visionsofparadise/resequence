import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit } from "../unit";

export class RingModEffectUnit extends Unit {
	readonly type = "ringmod" as const;
	readonly id = undefined;

	public readonly carrier: Unit;
	protected readonly innerUnits: ReadonlyArray<Unit>;

	constructor(carrier: Unit) {
		super();
		this.carrier = carrier;
		this.innerUnits = [carrier];
	}

	protected _setup(context: ScheduleContext): void {
		const modulatorGain = context.audioContext.createGain();
		modulatorGain.gain.value = 0;

		this.carrier.setup(context);

		for (const exit of this.carrier.exitNodes) {
			exit.connect(modulatorGain.gain);
		}

		this.entryNodes.push(modulatorGain);
		this.exitNodes.push(modulatorGain);
	}

	protected _teardown(context: ScheduleContext): void {
		this.carrier.teardown(context);
	}
}

export function ringmod(carrier: Unit): RingModEffectUnit {
	return new RingModEffectUnit(carrier);
}
