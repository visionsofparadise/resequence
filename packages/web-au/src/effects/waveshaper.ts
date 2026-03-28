import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit, buildCurve } from "@resequence/web-au-core";

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

export interface WaveShaperProperties extends UnitProperties {
	readonly curve: Float32Array<ArrayBuffer>;
	readonly oversample?: Oversample;
}

export class WaveShaperEffectUnit extends Unit {
	readonly type = ["unit", "waveshaper"] as const;
	declare readonly properties: WaveShaperProperties;

	static override is(value: unknown): value is WaveShaperEffectUnit {
		return Unit.is(value) && value.type[1] === "waveshaper";
	}

	public waveShaperNode: WaveShaperNode | undefined;

	constructor(properties: UnitInput<WaveShaperProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get curve(): Float32Array<ArrayBuffer> { return this.properties.curve; }
	get oversample(): Oversample | undefined { return this.properties.oversample; }

	protected override _setup(context: UnitContext): SetupResult {
		const waveShaperNode = context.audioContext.createWaveShaper();

		waveShaperNode.curve = this.curve;
		if (this.oversample !== undefined) waveShaperNode.oversample = this.oversample;

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
