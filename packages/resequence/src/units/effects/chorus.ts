import type { ScheduleContext } from "../../rendering/schedule-context";
import { proxyDriver } from "../../utils/driver";
import { lfo, type LfoUnit } from "../lfo";
import { Unit } from "../unit";
import { delay, type DelayEffectUnit } from "./delay";

export class ChorusEffectUnit extends Unit {
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	private readonly delay: number;
	private readonly rate: number;
	private readonly depth: number;
	private readonly feedback: number | undefined;
	public readonly id?: string;

	private delayUnit: DelayEffectUnit | undefined;
	private lfoUnit: LfoUnit | undefined;

	constructor({ delay, rate, depth, feedback, id }: { delay: number; rate: number; depth: number; feedback?: number; id?: string }) {
		super();
		this.delay = delay;
		this.rate = rate;
		this.depth = depth;
		this.feedback = feedback;
		this.id = id;
	}

	protected _setup(context: ScheduleContext): void {
		const delayId = crypto.randomUUID();
		const lfoId = crypto.randomUUID();

		const delayUnit = delay({ time: this.delay, feedback: this.feedback, id: delayId });

		for (const target of this.targets) delayUnit.targets.push(target);
		delayUnit.setup(context);

		this.entryNodes.push(...delayUnit.entryNodes);

		const lfoUnit = lfo({
			path: `${delayId}.time`,
			shape: "sine",
			rate: this.rate,
			depth: this.depth,
			id: lfoId,
		});
		lfoUnit.setup(context);

		proxyDriver(this.id, "time", `${delayId}.time`, context);
		proxyDriver(this.id, "rate", `${lfoId}.rate`, context);
		proxyDriver(this.id, "depth", `${lfoId}.depth`, context);

		this.delayUnit = delayUnit;
		this.lfoUnit = lfoUnit;
	}

	protected _teardown(context: ScheduleContext): void {
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
