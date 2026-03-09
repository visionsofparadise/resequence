import type { UnitContext } from "../context";
import { proxyDriver } from "../utils/driver";
import { Unit, type SetupResult, type UnitInput, type UnitProperties } from "../unit";
import { delay, type DelayEffectUnit } from "./delay";
import { allpass, lowpass, type FilterEffectUnit } from "./filter";
import { linearGain, type GainEffectUnit } from "./gain";

const COMB_DELAYS = [1116, 1188, 1277, 1356].map((samples) => (samples / 44100) * 1000);
const ALLPASS_DELAYS = [556, 441].map((samples) => (samples / 44100) * 1000);

export interface ReverbProperties extends UnitProperties {
	readonly roomSize: number;
	readonly damping: number;
	readonly previousProperties?: ReverbProperties;
}

export class ReverbEffectUnit extends Unit {
	readonly type = ["unit", "reverb"] as const;

	static override is(value: unknown): value is ReverbEffectUnit {
		return Unit.is(value) && value.type[1] === "reverb";
	}

	declare readonly properties: ReverbProperties;

	public inputUnit: GainEffectUnit | undefined;
	public combSumUnit: GainEffectUnit | undefined;
	public combDelays: Array<DelayEffectUnit> = [];
	public combFilters: Array<FilterEffectUnit> = [];
	public combFeedback: Array<GainEffectUnit> = [];
	public allpassFilters: Array<FilterEffectUnit> = [];

	constructor(properties: UnitInput<ReverbProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get roomSize(): number { return this.properties.roomSize; }
	get damping(): number { return this.properties.damping; }

	clone(overrides?: Partial<ReverbProperties>): ReverbEffectUnit {
		return new ReverbEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
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
			delayUnit.to(lowPassUnit);
			lowPassUnit.to(feedbackUnit);
			feedbackUnit.to(delayUnit);
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
		}

		await inputUnit.setup(context);

		for (let index = 0; index < feedbackIds.length; index++) {
			proxyDriver(this.id, "roomSize", `${feedbackIds[index]}.level`, context);
			proxyDriver(this.id, "damping", `${filterIds[index]}.frequency`, context);
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

export function reverb({ roomSize, damping, id }: { roomSize: number; damping: number; id?: string }): ReverbEffectUnit {
	return new ReverbEffectUnit({ roomSize, damping, id });
}

function lerp(start: number, end: number, factor: number): number {
	return start + (end - start) * factor;
}
