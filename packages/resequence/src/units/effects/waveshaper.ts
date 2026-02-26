import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit } from "../unit";

function buildCurve(transform: (x: number) => number): Float32Array<ArrayBuffer> {
	const samples = 256;
	const curve = new Float32Array(samples);

	for (let index = 0; index < samples; index++) {
		const x = (index * 2) / (samples - 1) - 1;
		curve[index] = transform(x);
	}

	return curve;
}

export const WaveShaperCurve = {
	SoftClip: buildCurve((x) => x / (1 + Math.abs(x))),
	HardClip: buildCurve((x) => Math.max(-0.8, Math.min(0.8, x * 1.5))),
	Fold: buildCurve((x) => Math.sin((x * Math.PI) / 2)),
	Saturate: buildCurve((x) => Math.sign(x) * (1 - Math.exp(-Math.abs(x) * 3))),
};

export type Oversample = "none" | "2x" | "4x";

export class WaveShaperEffectUnit extends Unit {
	readonly id = undefined;

	private readonly curve: Float32Array<ArrayBuffer>;
	private readonly oversample: Oversample | undefined;
	waveShaperNode: WaveShaperNode | undefined;

	constructor({ curve, oversample }: { curve: Float32Array<ArrayBuffer>; oversample?: Oversample }) {
		super();
		this.curve = curve;
		this.oversample = oversample;
	}

	protected _setup(context: ScheduleContext): void {
		const waveShaperNode = context.audioContext.createWaveShaper();
		waveShaperNode.curve = this.curve;
		if (this.oversample !== undefined) waveShaperNode.oversample = this.oversample;

		this.waveShaperNode = waveShaperNode;
		this.entryNodes.push(waveShaperNode);
		this.exitNodes.push(waveShaperNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		this.waveShaperNode = undefined;
	}
}

export function waveshaper({ curve, oversample }: { curve: Float32Array<ArrayBuffer>; oversample?: Oversample }): WaveShaperEffectUnit {
	return new WaveShaperEffectUnit({ curve, oversample });
}

export const distortion = waveshaper;
