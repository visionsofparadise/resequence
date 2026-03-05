import type { UnitContext } from "../context";
import { lfo, type LfoUnit } from "../lfo";
import { proxyDriver } from "../utils/driver";
import { Unit, type SetupResult, type UnitInput, type UnitProperties } from "../unit";
import { delay, type DelayEffectUnit } from "./delay";

export interface ChorusProperties extends UnitProperties {
	readonly delay: number;
	readonly rate: number;
	readonly depth: number;
	readonly feedback?: number;
	readonly previousProperties?: ChorusProperties;
}

export class ChorusEffectUnit extends Unit {
	readonly type = ["unit", "chorus"] as const;

	static override is(value: unknown): value is ChorusEffectUnit {
		return Unit.is(value) && value.type[1] === "chorus";
	}

	declare readonly properties: ChorusProperties;

	private delayUnit: DelayEffectUnit | undefined;
	private lfoUnit: LfoUnit | undefined;

	constructor(properties: UnitInput<ChorusProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get delay(): number { return this.properties.delay; }
	get rate(): number { return this.properties.rate; }
	get depth(): number { return this.properties.depth; }
	get feedback(): number | undefined { return this.properties.feedback; }

	clone(overrides?: Partial<ChorusProperties>): ChorusEffectUnit {
		return new ChorusEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const delayId = crypto.randomUUID();
		const lfoId = crypto.randomUUID();

		const delayUnit = delay({ time: this.delay, feedback: this.feedback, id: delayId });

		await delayUnit.setup(context);

		const lfoUnit = lfo({
			path: `${delayId}.time`,
			shape: "sine",
			rate: this.rate,
			depth: this.depth,
			id: lfoId,
		});
		await lfoUnit.setup(context);

		proxyDriver(this.id, "time", `${delayId}.time`, context);
		proxyDriver(this.id, "rate", `${lfoId}.rate`, context);
		proxyDriver(this.id, "depth", `${lfoId}.depth`, context);

		this.delayUnit = delayUnit;
		this.lfoUnit = lfoUnit;

		return { entries: [delayUnit], exits: [delayUnit] };
	}

	protected override _teardown(context: UnitContext): void {
		this.lfoUnit?.teardown(context);
		this.lfoUnit = undefined;
		this.delayUnit?.teardown(context);
		this.delayUnit = undefined;
	}
}

export function chorus({ rate, depth, feedback, id }: { rate: number; depth: number; feedback?: number; id?: string }): ChorusEffectUnit {
	return new ChorusEffectUnit({ delay: 25, rate, depth, feedback, id });
}

export function flanger({ rate, depth, feedback, id }: { rate: number; depth: number; feedback?: number; id?: string }): ChorusEffectUnit {
	return new ChorusEffectUnit({ delay: 5, rate, depth, feedback, id });
}
