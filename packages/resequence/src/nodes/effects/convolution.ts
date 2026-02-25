import type { ScheduleContext } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class ConvolutionEffectNode extends EffectNode {
	constructor(
		private readonly impulse: string,
		mix?: number,
		id?: string,
	) {
		super(mix, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let convolutionNode = node instanceof ConvolverNode ? node : undefined;

		if (!convolutionNode) {
			convolutionNode = scheduleContext.audioContext.createConvolver();

			const impulseBuffer = scheduleContext.sampleMap.get(this.impulse);

			if (impulseBuffer) convolutionNode.buffer = impulseBuffer;

			scheduleContext.nodeMap.set(this.effectsId, convolutionNode);
		}

		audio.connect(convolutionNode);

		this.forward(audio, [convolutionNode], noteContext, scheduleContext);
	}
}

export function convolution({ impulse, mix, id }: { impulse: string; mix?: number; id?: string }): ConvolutionEffectNode {
	return new ConvolutionEffectNode(impulse, mix, id);
}
