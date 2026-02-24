import type { ScheduleContext } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class ReverbEffectNode extends EffectNode {
	constructor(
		private readonly impulse: string,
		id?: string,
	) {
		super(id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let reverbNode = node instanceof ConvolverNode ? node : undefined;

		if (!reverbNode) {
			reverbNode = scheduleContext.audioContext.createConvolver();

			const impulseBuffer = scheduleContext.sampleMap.get(this.impulse);

			if (impulseBuffer) reverbNode.buffer = impulseBuffer;

			scheduleContext.nodeMap.set(this.effectsId, reverbNode);
		}

		this.forward(audio, reverbNode, noteContext, scheduleContext);
	}
}

export function reverb({ impulse, id }: { impulse: string; id?: string }): ReverbEffectNode {
	return new ReverbEffectNode(impulse, id);
}
