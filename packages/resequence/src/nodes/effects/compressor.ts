import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class CompressorEffectNode extends EffectNode {
	readonly type = "compressor" as const;

	constructor(
		private readonly threshold: number,
		private readonly ratio: number,
		private readonly attack: number | undefined,
		private readonly release: number | undefined,
		id?: string,
	) {
		super(id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let compressorNode = node instanceof DynamicsCompressorNode ? node : undefined;

		if (!compressorNode) {
			compressorNode = scheduleContext.audioContext.createDynamicsCompressor();
			compressorNode.threshold.value = this.threshold;
			compressorNode.ratio.value = this.ratio;

			if (this.attack !== undefined) compressorNode.attack.value = this.attack;
			if (this.release !== undefined) compressorNode.release.value = this.release;

			if (this.id) {
				const threshDriver = getOrCreateDriver(`${this.id}.threshold`, this.threshold, scheduleContext);
				compressorNode.threshold.value = 0;
				threshDriver.connect(compressorNode.threshold);

				const ratioDriver = getOrCreateDriver(`${this.id}.ratio`, this.ratio, scheduleContext);
				compressorNode.ratio.value = 0;
				ratioDriver.connect(compressorNode.ratio);
			}

			scheduleContext.nodeMap.set(this.effectsId, compressorNode);
		}

		this.forward(audio, compressorNode, noteContext, scheduleContext);
	}
}

export function compressor({ threshold, ratio, attack, release, id }: { threshold: number; ratio: number; attack?: number; release?: number; id?: string }): CompressorEffectNode {
	return new CompressorEffectNode(threshold, ratio, attack, release, id);
}
