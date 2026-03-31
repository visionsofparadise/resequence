import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { filter } from "./filter";
import { compressor } from "./compressor";
import { mix } from "./mix";
import { chain } from "../composites/chain";

const deEssSchema = z.object({
	frequency: z.number().min(20).max(20000).default(6500).describe("Frequency"),
	threshold: z.number().min(-100).max(0).default(-20).describe("Threshold (dB)"),
	ratio: z.number().min(1).max(20).default(4).describe("Ratio"),
	attack: z.number().min(0).max(1000).default(0.5).describe("Attack (ms)").optional(),
	release: z.number().min(0).max(1000).default(50).describe("Release (ms)").optional(),
});

export class DeEssEffectUnit extends Unit<typeof deEssSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "de-ess";

	private bandChain: Unit | undefined;

	constructor(input: z.infer<typeof deEssSchema> & UnitInput) {
		super(input, deEssSchema);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const bandCompressed = chain(
			filter({ mode: "bandpass", frequency: this.parameters.frequency.value, resonance: 1 }),
			compressor({
				threshold: this.parameters.threshold.value,
				ratio: this.parameters.ratio.value,
				attack: this.parameters.attack?.value ?? 0.5,
				release: this.parameters.release?.value ?? 50,
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
