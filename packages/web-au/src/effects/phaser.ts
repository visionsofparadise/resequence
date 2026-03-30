import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit, proxyDriver, live } from "@resequence/web-au-core";
import { z } from "zod";
import { lfo, type LfoUnit } from "../lfo";
import { allpass, type FilterEffectUnit } from "./filter";

const phaserSchema = z.object({
	rate: live(z.number().min(0.01).max(100).default(1).describe("Rate (Hz)")),
	depth: live(z.number().min(0).max(1).default(0.5).describe("Depth")),
});

export class PhaserEffectUnit extends Unit<typeof phaserSchema> {
	readonly type = ["unit", "phaser"] as const;

	static override is(value: unknown): value is PhaserEffectUnit {
		return Unit.is(value) && value.type[1] === "phaser";
	}


	readonly stages: number;
	private stageChain: Array<FilterEffectUnit> = [];
	private lfoUnit: LfoUnit | undefined;

	constructor(input: z.infer<typeof phaserSchema> & UnitInput & { readonly stages: number }) {
		super(input, phaserSchema);
		this.stages = input.stages;
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
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

		const lfoUnit = lfo({ path: lfoPath, shape: "sine", rate: this.parameters.rate.value, depth: this.parameters.depth.value, id: lfoId });

		await lfoUnit.setup(context);

		const lfoEntry = context.driverMap.get(lfoPath);

		if (lfoEntry) {
			for (const stageId of stageIds) {
				const stageEntry = context.driverMap.get(`${stageId}.frequency`);

				if (stageEntry) lfoEntry.node.connect(stageEntry.node.offset);
			}
		}

		proxyDriver(this.parameters.rate, lfoUnit.parameters.rate, context);
		proxyDriver(this.parameters.depth, lfoUnit.parameters.depth, context);

		this.stageChain = stageFilters;
		this.lfoUnit = lfoUnit;

		return { entries: [firstStage], exits: [lastStage] };
	}

	protected override _teardown(context: UnitContext): void {
		this.lfoUnit?.teardown(context);
		this.lfoUnit = undefined;
		this.stageChain[0]?.teardown(context);
		this.stageChain = [];
	}
}

export function phaser({ stages, rate, depth, id }: { stages: number; rate: number; depth: number; id?: string }): PhaserEffectUnit {
	return new PhaserEffectUnit({ stages, rate, depth, id });
}
