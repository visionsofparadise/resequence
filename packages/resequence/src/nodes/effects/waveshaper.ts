import type { ScheduleContext } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

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

export class WaveShaperEffectNode extends EffectNode {
	constructor(
		private readonly curve: Float32Array<ArrayBuffer>,
		mix?: number,
		id?: string,
	) {
		super(mix, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let waveShaperNode = node instanceof WaveShaperNode ? node : undefined;

		if (!waveShaperNode) {
			waveShaperNode = scheduleContext.audioContext.createWaveShaper();
			waveShaperNode.curve = this.curve;
			scheduleContext.nodeMap.set(this.effectsId, waveShaperNode);
		}

		audio.connect(waveShaperNode);
		this.forward(audio, [waveShaperNode], noteContext, scheduleContext);
	}
}

export function waveshaper({ curve, mix, id }: { curve: Float32Array<ArrayBuffer>; mix?: number; id?: string }): WaveShaperEffectNode {
	return new WaveShaperEffectNode(curve, mix, id);
}

export const distortion = waveshaper;
