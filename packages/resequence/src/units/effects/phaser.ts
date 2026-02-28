import type { ScheduleContext } from "../../rendering/schedule-context";
import { proxyDriver } from "../../utils/driver";
import { lfo, type LfoUnit } from "../lfo";
import { Unit, type SetupResult } from "../unit";
import { allpass, type FilterEffectUnit } from "./filter";

export class PhaserEffectUnit extends Unit {
	private readonly stages: number;
	private readonly rate: number;
	private readonly depth: number;
	public readonly id?: string;

	private stageChain: Array<FilterEffectUnit> = [];
	private lfoUnit: LfoUnit | undefined;

	constructor({ stages, rate, depth, id }: { stages: number; rate: number; depth: number; id?: string }) {
		super();
		this.stages = stages;
		this.rate = rate;
		this.depth = depth;
		this.id = id;
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		const stageFilters: Array<FilterEffectUnit> = [];
		const stageIds: Array<string> = [];

		for (let index = 0; index < this.stages; index++) {
			const stageId = crypto.randomUUID();
			stageIds.push(stageId);
			stageFilters.push(allpass({ frequency: 1000, id: stageId }));
		}

		for (let index = 0; index < stageFilters.length - 1; index++) {
			const current = stageFilters[index];
			const next = stageFilters[index + 1];

			if (current && next) current.to(next);
		}

		const firstStage = stageFilters[0];
		const lastStage = stageFilters[stageFilters.length - 1];

		if (!firstStage || !lastStage) return {};

		await firstStage.setup(context);

		const lfoPath = crypto.randomUUID();
		const lfoId = crypto.randomUUID();

		const lfoUnit = lfo({ path: lfoPath, shape: "sine", rate: this.rate, depth: this.depth, id: lfoId });
		await lfoUnit.setup(context);

		const lfoDriver = context.driverMap.get(lfoPath);
		if (lfoDriver) {
			for (const stageId of stageIds) {
				const stageDriver = context.driverMap.get(`${stageId}.frequency`);
				if (stageDriver) lfoDriver.connect(stageDriver.offset);
			}
		}

		proxyDriver(this.id, "rate", `${lfoId}.rate`, context);
		proxyDriver(this.id, "depth", `${lfoId}.depth`, context);

		this.stageChain = stageFilters;
		this.lfoUnit = lfoUnit;

		return { entries: [firstStage], exits: [lastStage] };
	}

	protected _teardown(context: ScheduleContext): void {
		this.lfoUnit?.teardown(context);
		this.lfoUnit = undefined;
		this.stageChain[0]?.teardown(context);
		this.stageChain = [];
	}
}

export function phaser({ stages, rate, depth, id }: { stages: number; rate: number; depth: number; id?: string }): PhaserEffectUnit {
	return new PhaserEffectUnit({ stages, rate, depth, id });
}
