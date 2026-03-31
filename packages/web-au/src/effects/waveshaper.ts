import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit, buildCurve } from "@resequence/web-au-core";
import { z } from "zod";

export const WaveShaperCurve = {
	SoftClip: buildCurve((x) => x / (1 + Math.abs(x))),
	HardClip: buildCurve((x) => Math.max(-0.8, Math.min(0.8, x * 1.5))),
	Fold: buildCurve((x) => Math.sin((x * Math.PI) / 2)),
	Saturate: buildCurve((x) => Math.sign(x) * (1 - Math.exp(-Math.abs(x) * 3))),
	Wavefolder: buildCurve((x) => Math.sin(x * 2 * (Math.PI / 2))),
	HalfRectify: buildCurve((x) => Math.max(0, x)),
	FullRectify: buildCurve((x) => Math.abs(x)),
};

export type Oversample = "none" | "2x" | "4x";

const waveShaperSchema = z.object({
	oversample: z.enum(["none", "2x", "4x"]).default("none").describe("Oversample").optional(),
});

export class WaveShaperEffectUnit extends Unit<typeof waveShaperSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "waveshaper";

	readonly curve: Float32Array<ArrayBuffer>;
	public waveShaperNode: WaveShaperNode | undefined;

	constructor(input: z.infer<typeof waveShaperSchema> & UnitInput & { readonly curve: Float32Array<ArrayBuffer> }) {
		super(input, waveShaperSchema);
		this.curve = input.curve;
	}

	protected override _setup(context: UnitContext): SetupResult {
		const waveShaperNode = context.audioContext.createWaveShaper();

		waveShaperNode.curve = this.curve;
		if (this.parameters.oversample?.value !== undefined) waveShaperNode.oversample = this.parameters.oversample.value;

		this.waveShaperNode = waveShaperNode;

		return { entries: [waveShaperNode], exits: [waveShaperNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.waveShaperNode = undefined;
	}
}

export function waveshaper({ curve, oversample }: { curve: Float32Array<ArrayBuffer>; oversample?: Oversample }): WaveShaperEffectUnit {
	return new WaveShaperEffectUnit({ curve, oversample });
}

export const distortion = waveshaper;
