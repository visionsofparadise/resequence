import { Unit, proxyDriver } from "@resequence/web-au-core";
import { lfo, type LfoUnit } from "../lfo";
import { delay, type DelayEffectUnit } from "./delay";
import { rateDepthSchema } from "./utils/rateDepthSchema";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import type { z } from "zod";

export class ChorusEffectUnit extends Unit<typeof rateDepthSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "chorus";

	readonly delay: number;
	readonly feedback: number | undefined;
	private delayUnit: DelayEffectUnit | undefined;
	private lfoUnit: LfoUnit | undefined;

	constructor(
		input: z.infer<typeof rateDepthSchema> & UnitInput & { readonly delay: number; readonly feedback?: number },
	) {
		super(input, rateDepthSchema);
		this.delay = input.delay;
		this.feedback = input.feedback;
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const delayId = crypto.randomUUID();
		const lfoId = crypto.randomUUID();

		const delayUnit = delay({ id: delayId, time: this.delay, feedback: this.feedback });

		await delayUnit.setup(context);

		const lfoUnit = lfo({
			id: lfoId,
			path: `${delayId}.time`,
			shape: "sine",
			rate: this.parameters.rate.value,
			depth: this.parameters.depth.value,
		});

		await lfoUnit.setup(context);

		proxyDriver(this.parameters.rate, lfoUnit.parameters.rate, context);
		proxyDriver(this.parameters.depth, lfoUnit.parameters.depth, context);

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

export function chorus({
	rate,
	depth,
	feedback,
	id,
}: {
	rate: number;
	depth: number;
	feedback?: number;
	id?: string;
}): ChorusEffectUnit {
	return new ChorusEffectUnit({ delay: 25, rate, depth, feedback, id });
}

export function flanger({
	rate,
	depth,
	feedback,
	id,
}: {
	rate: number;
	depth: number;
	feedback?: number;
	id?: string;
}): ChorusEffectUnit {
	return new ChorusEffectUnit({ delay: 5, rate, depth, feedback, id });
}
