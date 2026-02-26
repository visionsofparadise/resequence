import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit } from "../unit";

export class AmEffectUnit extends Unit {
	readonly type = "am" as const;
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

		this.entryNodes.push(modulatorGain);
		this.exitNodes.push(modulatorGain);
	}

	protected _teardown(context: ScheduleContext): void {
		this.carrier.teardown(context);
	}
}

export function am(carrier: Unit): AmEffectUnit {
	return new AmEffectUnit(carrier);
}
