import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class BitcrushEffectNode extends EffectNode {
	constructor(
		private readonly bits: number,
		mix?: number,
		id?: string,
	) {
		super(mix, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let workletNode = node instanceof AudioWorkletNode ? node : undefined;

		if (!workletNode) {
			workletNode = new AudioWorkletNode(scheduleContext.audioContext, "bitcrush-processor");

			let bitsParam: AudioParam | undefined;

			workletNode.parameters.forEach((param, name) => {
				if (name === "bits") bitsParam = param;
			});

			if (bitsParam) {
				if (this.id) {
					const bitsDriver = getOrCreateDriver(`${this.id}.bits`, this.bits, scheduleContext);

					bitsParam.value = 0;
					bitsDriver.connect(bitsParam);
				} else {
					bitsParam.value = this.bits;
				}
			}

			scheduleContext.nodeMap.set(this.effectsId, workletNode);
		}

		audio.connect(workletNode);

		this.forward(audio, [workletNode], noteContext, scheduleContext);
	}
}

export function bitcrush({ bits, mix, id }: { bits: number; mix?: number; id?: string }): BitcrushEffectNode {
	return new BitcrushEffectNode(bits, mix, id);
}
