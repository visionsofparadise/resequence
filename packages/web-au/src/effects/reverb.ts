import { Unit, proxyDriver, live } from "@resequence/web-au-core";
import { z } from "zod";
import { delay, type DelayEffectUnit } from "./delay";
import { allpass, lowpass, type FilterEffectUnit } from "./filter";
import { linearGain, type GainEffectUnit } from "./gain";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

const COMB_DELAYS = [1116, 1188, 1277, 1356].map((samples) => (samples / 44100) * 1000);
const ALLPASS_DELAYS = [556, 441].map((samples) => (samples / 44100) * 1000);

const reverbSchema = z.object({
	roomSize: live(z.number().min(0).max(1).default(0.7).describe("Room Size")),
	damping: live(z.number().min(0).max(1).default(0.5).describe("Damping")),
});

export class ReverbEffectUnit extends Unit<typeof reverbSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "reverb";

	public inputUnit: GainEffectUnit | undefined;
	public combSumUnit: GainEffectUnit | undefined;
	public combDelays: Array<DelayEffectUnit> = [];
	public combFilters: Array<FilterEffectUnit> = [];
	public combFeedback: Array<GainEffectUnit> = [];
	public allpassFilters: Array<FilterEffectUnit> = [];

	constructor(input: z.infer<typeof reverbSchema> & UnitInput) {
		super(input, reverbSchema);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const inputUnit = linearGain({ level: 1 });
		const combSumUnit = linearGain({ level: 0.25 });
		const lowPassCutoff = lerp(10000, 500, this.parameters.damping.value);

		for (const delayTime of COMB_DELAYS) {
			const filterId = crypto.randomUUID();
			const feedbackId = crypto.randomUUID();

			const delayUnit = delay({ time: delayTime });
			const lowPassUnit = lowpass({ frequency: lowPassCutoff, id: filterId });
			const feedbackUnit = linearGain({ level: this.parameters.roomSize.value, id: feedbackId });

			inputUnit.to(delayUnit);
			delayUnit.to(lowPassUnit);
			lowPassUnit.to(feedbackUnit);
			feedbackUnit.to(delayUnit);
			delayUnit.to(combSumUnit);

			this.combDelays.push(delayUnit);
			this.combFilters.push(lowPassUnit);
			this.combFeedback.push(feedbackUnit);
		}

		const allpassFilters: Array<FilterEffectUnit> = [];

		for (const delayTime of ALLPASS_DELAYS) {
			allpassFilters.push(allpass({ frequency: 1000 / delayTime }));
		}

		for (let index = 0; index < allpassFilters.length - 1; index++) {
			const current = allpassFilters[index];
			const next = allpassFilters[index + 1];

			if (current && next) current.to(next);
		}

		const firstAllpass = allpassFilters[0];
		const lastAllpass = allpassFilters[allpassFilters.length - 1];

		if (firstAllpass && lastAllpass) {
			combSumUnit.to(firstAllpass);
		}

		await inputUnit.setup(context);

		for (const [index, feedbackUnit] of this.combFeedback.entries()) {
			const filterUnit = this.combFilters[index];

			if (!filterUnit) continue;

			proxyDriver(this.parameters.roomSize, feedbackUnit.parameters.level, context);
			proxyDriver(this.parameters.damping, filterUnit.parameters.frequency, context);
		}

		this.inputUnit = inputUnit;
		this.combSumUnit = combSumUnit;
		this.allpassFilters = allpassFilters;

		return { entries: [inputUnit], exits: [lastAllpass ?? combSumUnit] };
	}

	protected override _teardown(context: UnitContext): void {
		this.inputUnit?.teardown(context);
		this.inputUnit = undefined;
		this.combSumUnit = undefined;
		this.combDelays = [];
		this.combFilters = [];
		this.combFeedback = [];
		this.allpassFilters = [];
	}
}

export function reverb({
	roomSize,
	damping,
	id,
}: {
	roomSize: number;
	damping: number;
	id?: string;
}): ReverbEffectUnit {
	return new ReverbEffectUnit({ roomSize, damping, id });
}

function lerp(start: number, end: number, factor: number): number {
	return start + (end - start) * factor;
}
