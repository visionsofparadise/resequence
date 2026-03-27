import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";

export interface AmProperties extends UnitProperties {
	readonly carrier: Unit;
	readonly previousProperties?: AmProperties;
}

export class AmEffectUnit extends Unit {
	readonly type = ["unit", "am"] as const;
	declare readonly properties: AmProperties;

	static override is(value: unknown): value is AmEffectUnit {
		return Unit.is(value) && value.type[1] === "am";
	}

	private dcOffsetNode: ConstantSourceNode | undefined;

	constructor(properties: UnitInput<AmProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get carrier(): Unit { return this.properties.carrier; }

	clone(overrides?: Partial<AmProperties>): AmEffectUnit {
		return new AmEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
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
