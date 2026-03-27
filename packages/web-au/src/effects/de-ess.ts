import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { filter } from "./filter";
import { compressor } from "./compressor";
import { mix } from "./mix";
import { chain } from "../composites/chain";

export interface DeEssProperties extends UnitProperties {
	readonly frequency: number;
	readonly threshold: number;
	readonly ratio: number;
	readonly attack?: number;
	readonly release?: number;
	readonly previousProperties?: DeEssProperties;
}

export class DeEssEffectUnit extends Unit {
	readonly type = ["unit", "de-ess"] as const;

	static override is(value: unknown): value is DeEssEffectUnit {
		return Unit.is(value) && value.type[1] === "de-ess";
	}

	declare readonly properties: DeEssProperties;

	private bandChain: Unit | undefined;

	constructor(properties: UnitInput<DeEssProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get frequency(): number { return this.properties.frequency; }
	get threshold(): number { return this.properties.threshold; }
	get ratio(): number { return this.properties.ratio; }
	get attack(): number | undefined { return this.properties.attack; }
	get release(): number | undefined { return this.properties.release; }

	clone(overrides?: Partial<DeEssProperties>): DeEssEffectUnit {
		return new DeEssEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const bandCompressed = chain(
			filter({ mode: "bandpass", frequency: this.frequency, resonance: 1 }),
			compressor({
				threshold: this.threshold,
				ratio: this.ratio,
				attack: this.attack ?? 0.5,
				release: this.release ?? 50,
			}),
		);

		const mixUnit = mix(bandCompressed, 1);

		this.bandChain = mixUnit;

		return { entries: [mixUnit], exits: [mixUnit] };
	}

	protected override _teardown(context: UnitContext): void {
		this.bandChain?.teardown(context);
		this.bandChain = undefined;
	}
}

export function deEss(options?: {
	frequency?: number;
	threshold?: number;
	ratio?: number;
	attack?: number;
	release?: number;
	id?: string;
}): DeEssEffectUnit {
	return new DeEssEffectUnit({
		frequency: options?.frequency ?? 6500,
		threshold: options?.threshold ?? -20,
		ratio: options?.ratio ?? 4,
		attack: options?.attack,
		release: options?.release,
		id: options?.id,
	});
}

export const deSibilance = deEss;
