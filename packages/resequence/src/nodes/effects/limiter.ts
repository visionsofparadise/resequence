import type { ScheduleContext } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class LimiterEffectNode extends EffectNode {
	constructor(
		private readonly threshold: number,
		private readonly release: number,
		mix?: number,
		id?: string,
	) {
		super(mix, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let compressorNode = node instanceof DynamicsCompressorNode ? node : undefined;

		if (!compressorNode) {
			compressorNode = scheduleContext.audioContext.createDynamicsCompressor();
			compressorNode.threshold.value = this.threshold;
			compressorNode.knee.value = 0;
			compressorNode.ratio.value = 100;
			compressorNode.attack.value = 0.001;
			compressorNode.release.value = this.release;

			scheduleContext.nodeMap.set(this.effectsId, compressorNode);
		}

		audio.connect(compressorNode);

		this.forward(audio, [compressorNode], noteContext, scheduleContext);
	}
}

export function limiter({ threshold = -3, release = 0.1, mix, id }: { threshold?: number; release?: number; mix?: number; id?: string } = {}): LimiterEffectNode {
	return new LimiterEffectNode(threshold, release, mix, id);
}
