import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit, type SetupResult } from "../unit";

export class AmEffectUnit extends Unit {
	readonly type = "am" as const;
	readonly id = undefined;

	public readonly carrier: Unit;

	private dcOffsetNode: ConstantSourceNode | undefined;

	constructor(carrier: Unit) {
		super();

		this.carrier = carrier;
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
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

	protected _teardown(context: ScheduleContext): void {
		this.dcOffsetNode?.stop();
		this.dcOffsetNode?.disconnect();
		this.dcOffsetNode = undefined;
		this.carrier.teardown(context);
	}
}

export function am(carrier: Unit): AmEffectUnit {
	return new AmEffectUnit(carrier);
}
