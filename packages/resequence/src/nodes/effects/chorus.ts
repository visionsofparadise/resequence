import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class ChorusEffectNode extends EffectNode {
	constructor(
		private readonly baseDelay: number,
		private readonly rate: number,
		private readonly depth: number,
		private readonly feedback: number | undefined,
		mix?: number,
		id?: string,
	) {
		super(mix, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let delayNode = node instanceof DelayNode ? node : undefined;

		if (!delayNode) {
			delayNode = scheduleContext.audioContext.createDelay(this.baseDelay + this.depth + 0.1);
			delayNode.delayTime.value = this.baseDelay;

			const lfo = scheduleContext.audioContext.createOscillator();
			lfo.type = "sine";
			lfo.frequency.value = this.rate;

			const depthGain = scheduleContext.audioContext.createGain();
			depthGain.gain.value = this.depth;

			lfo.connect(depthGain);
			depthGain.connect(delayNode.delayTime);
			lfo.start(scheduleContext.audioContext.currentTime);

			if (this.feedback !== undefined) {
				const feedbackGain = scheduleContext.audioContext.createGain();

				feedbackGain.gain.value = this.feedback;
				delayNode.connect(feedbackGain);
				feedbackGain.connect(delayNode);
			}

			if (this.id) {
				const rateDriver = getOrCreateDriver(`${this.id}.rate`, this.rate, scheduleContext);
				lfo.frequency.value = 0;
				rateDriver.connect(lfo.frequency);

				const depthDriver = getOrCreateDriver(`${this.id}.depth`, this.depth, scheduleContext);
				depthGain.gain.value = 0;
				depthDriver.connect(depthGain.gain);
			}

			scheduleContext.nodeMap.set(this.effectsId, delayNode);
			scheduleContext.nodeMap.set(`${this.effectsId}.lfo`, lfo);
			scheduleContext.nodeMap.set(`${this.effectsId}.depth`, depthGain);
		}

		audio.connect(delayNode);
		this.forward(audio, [delayNode], noteContext, scheduleContext);
	}
}

export function chorus({ rate, depth, feedback, mix, id }: { rate: number; depth: number; feedback?: number; mix?: number; id?: string }): ChorusEffectNode {
	return new ChorusEffectNode(0.025, rate, depth, feedback, mix, id);
}

export function flanger({ rate, depth, feedback, mix, id }: { rate: number; depth: number; feedback?: number; mix?: number; id?: string }): ChorusEffectNode {
	return new ChorusEffectNode(0.005, rate, depth, feedback, mix, id);
}
