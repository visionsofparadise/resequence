import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class DownsampleEffectNode extends EffectNode {
	constructor(
		private readonly rate: number,
		mix?: number,
		id?: string,
	) {
		super(mix, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let workletNode = node instanceof AudioWorkletNode ? node : undefined;

		if (!workletNode) {
			workletNode = new AudioWorkletNode(scheduleContext.audioContext, "downsample-processor");

			let rateParam: AudioParam | undefined;

			workletNode.parameters.forEach((param, name) => {
				if (name === "targetRate") rateParam = param;
			});

			if (rateParam) {
				if (this.id) {
					const rateDriver = getOrCreateDriver(`${this.id}.rate`, this.rate, scheduleContext);
					rateParam.value = 0;
					rateDriver.connect(rateParam);
				} else {
					rateParam.value = this.rate;
				}
			}

			scheduleContext.nodeMap.set(this.effectsId, workletNode);
		}

		audio.connect(workletNode);

		this.forward(audio, [workletNode], noteContext, scheduleContext);
	}
}

export function downsample({ rate, mix, id }: { rate: number; mix?: number; id?: string }): DownsampleEffectNode {
	return new DownsampleEffectNode(rate, mix, id);
}

export const sampleRate = downsample;
