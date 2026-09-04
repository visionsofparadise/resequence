import { Unit, driveParam, live } from "@resequence/web-au-core";
import { z } from "zod";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

const compressorSchema = z.object({
	threshold: live(z.number().min(-100).max(0).default(-24).describe("Threshold (dB)")),
	ratio: live(z.number().min(1).max(20).default(4).describe("Ratio")),
	knee: live(z.number().min(0).max(40).default(30).describe("Knee")).optional(),
	attack: live(z.number().min(0).max(1000).default(3).describe("Attack (ms)")).optional(),
	release: live(z.number().min(0).max(1000).default(250).describe("Release (ms)")).optional(),
});

export class CompressorEffectUnit extends Unit<typeof compressorSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "compressor";

	public compressorNode: DynamicsCompressorNode | undefined;

	constructor(input: z.infer<typeof compressorSchema> & UnitInput) {
		super(input, compressorSchema);
	}

	protected override _setup(context: UnitContext): SetupResult {
		const compressorNode = context.audioContext.createDynamicsCompressor();

		driveParam(compressorNode.threshold, this.parameters.threshold, undefined, context);
		driveParam(compressorNode.ratio, this.parameters.ratio, undefined, context);

		if (this.parameters.knee?.value !== undefined) compressorNode.knee.value = this.parameters.knee.value;

		if (this.parameters.attack?.value !== undefined)
			compressorNode.attack.value = this.parameters.attack.value / 1000;

		if (this.parameters.release?.value !== undefined)
			compressorNode.release.value = this.parameters.release.value / 1000;

		this.compressorNode = compressorNode;

		return { entries: [compressorNode], exits: [compressorNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.compressorNode = undefined;
	}
}

export function compressor({
	threshold,
	knee,
	ratio,
	attack,
	release,
	id,
}: {
	threshold: number;
	knee?: number;
	ratio: number;
	attack?: number;
	release?: number;
	id?: string;
}): CompressorEffectUnit {
	return new CompressorEffectUnit({ threshold, knee, ratio, attack, release, id });
}

export function limiter({
	threshold = -3,
	release = 100,
	id,
}: { threshold?: number; release?: number; id?: string } = {}): CompressorEffectUnit {
	return new CompressorEffectUnit({ threshold, knee: 0, ratio: 100, attack: 1, release, id });
}
