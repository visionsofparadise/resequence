import type { UnitContext } from "../context";
import { lfo, type LfoUnit } from "../lfo";
import { proxyDriver } from "../utils/driver";
import { Unit, type SetupResult, type UnitInput, type UnitProperties } from "../unit";
import { allpass, type FilterEffectUnit } from "./filter";

export interface PhaserProperties extends UnitProperties {
	readonly stages: number;
	readonly rate: number;
	readonly depth: number;
	readonly previousProperties?: PhaserProperties;
}

export class PhaserEffectUnit extends Unit {
	readonly type = ["unit", "phaser"] as const;
	declare readonly properties: PhaserProperties;

	static override is(value: unknown): value is PhaserEffectUnit {
		return Unit.is(value) && value.type[1] === "phaser";
	}

	private stageChain: Array<FilterEffectUnit> = [];
	private lfoUnit: LfoUnit | undefined;

	constructor(properties: UnitInput<PhaserProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get stages(): number { return this.properties.stages; }
	get rate(): number { return this.properties.rate; }
	get depth(): number { return this.properties.depth; }

	clone(overrides?: Partial<PhaserProperties>): PhaserEffectUnit {
		return new PhaserEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
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

		const lfoUnit = lfo({ path: lfoPath, shape: "sine", rate: this.rate, depth: this.depth, id: lfoId });

		await lfoUnit.setup(context);

		const lfoEntry = context.driverMap.get(lfoPath);

		if (lfoEntry) {
			for (const stageId of stageIds) {
				const stageEntry = context.driverMap.get(`${stageId}.frequency`);

				if (stageEntry) lfoEntry.node.connect(stageEntry.node.offset);
			}
		}

		proxyDriver(this.id, "rate", `${lfoId}.rate`, context);
		proxyDriver(this.id, "depth", `${lfoId}.depth`, context);

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
