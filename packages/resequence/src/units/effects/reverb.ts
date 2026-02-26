import type { ScheduleContext } from "../../rendering/schedule-context";
import { proxyDriver } from "../../utils/driver";
import { Unit } from "../unit";
import { delay, type DelayEffectUnit } from "./delay";
import { allpass, lowpass, type FilterEffectUnit } from "./filter";
import { linearGain, type GainEffectUnit } from "./gain";

const COMB_DELAYS = [1116, 1188, 1277, 1356].map((samples) => (samples / 44100) * 1000);
const ALLPASS_DELAYS = [556, 441].map((samples) => (samples / 44100) * 1000);

export class ReverbEffectUnit extends Unit {
	private readonly roomSize: number;
	private readonly damping: number;
	public readonly id?: string;

	public inputUnit: GainEffectUnit | undefined;
	public combSumUnit: GainEffectUnit | undefined;
	public combDelays: Array<DelayEffectUnit> = [];
	public combFilters: Array<FilterEffectUnit> = [];
	public combFeedback: Array<GainEffectUnit> = [];
	public allpassFilters: Array<FilterEffectUnit> = [];

	constructor({ roomSize, damping, id }: { roomSize: number; damping: number; id?: string }) {
		super();
		this.roomSize = roomSize;
		this.damping = damping;
		this.id = id;
	}

	protected _setup(context: ScheduleContext): void {
		const inputUnit = linearGain({ level: 1 });
		const combSumUnit = linearGain({ level: 0.25 });
		const lowPassCutoff = lerp(10000, 500, this.damping);

		const feedbackIds: Array<string> = [];
		const filterIds: Array<string> = [];

		for (const delayTime of COMB_DELAYS) {
			const filterId = crypto.randomUUID();
			const feedbackId = crypto.randomUUID();

			const delayUnit = delay({ time: delayTime });
			const lowPassUnit = lowpass({ frequency: lowPassCutoff, id: filterId });
			const feedbackUnit = linearGain({ level: this.roomSize, id: feedbackId });

			inputUnit.to(delayUnit);
			delayUnit.to(lowPassUnit).to(feedbackUnit).to(delayUnit);
			delayUnit.to(combSumUnit);

			feedbackIds.push(feedbackId);
			filterIds.push(filterId);
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
			for (const target of this.targets) lastAllpass.to(target);
		} else {
			for (const target of this.targets) combSumUnit.to(target);
		}

		inputUnit.setup(context);

		for (let index = 0; index < feedbackIds.length; index++) {
			proxyDriver(this.id, "roomSize", `${feedbackIds[index]}.level`, context);
			proxyDriver(this.id, "damping", `${filterIds[index]}.frequency`, context);
		}

		this.inputUnit = inputUnit;
		this.combSumUnit = combSumUnit;
		this.allpassFilters = allpassFilters;
		this.entryNodes.push(...inputUnit.entryNodes);
	}

	protected _teardown(context: ScheduleContext): void {
		this.inputUnit?.teardown(context);
		this.inputUnit = undefined;
		this.combSumUnit = undefined;
		this.combDelays = [];
		this.combFilters = [];
		this.combFeedback = [];
		this.allpassFilters = [];
	}
}

export function reverb({ roomSize, damping, id }: { roomSize: number; damping: number; id?: string }): ReverbEffectUnit {
	return new ReverbEffectUnit({ roomSize, damping, id });
}

function lerp(start: number, end: number, factor: number): number {
	return start + (end - start) * factor;
}
