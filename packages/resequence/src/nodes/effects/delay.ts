import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class DelayEffectNode extends EffectNode {
	constructor(
		private readonly time: number,
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
			delayNode = scheduleContext.audioContext.createDelay(this.time + 1);
			delayNode.delayTime.value = this.time;

			if (this.feedback !== undefined && this.feedback > 0) {
				const feedbackGain = scheduleContext.audioContext.createGain();
				feedbackGain.gain.value = this.feedback;
				delayNode.connect(feedbackGain);
				feedbackGain.connect(delayNode);
			}

			if (this.id) {
				const driver = getOrCreateDriver(`${this.id}.time`, this.time, scheduleContext);
				delayNode.delayTime.value = 0;
				driver.connect(delayNode.delayTime);
			}

			scheduleContext.nodeMap.set(this.effectsId, delayNode);
		}

		audio.connect(delayNode);

		this.forward(audio, [delayNode], noteContext, scheduleContext);
	}
}

export function delay({ time, feedback, mix, id }: { time: number; feedback?: number; mix?: number; id?: string }): DelayEffectNode {
	return new DelayEffectNode(time, feedback, mix, id);
}
