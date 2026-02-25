import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class PanEffectNode extends EffectNode {
	readonly type = "pan" as const;

	constructor(
		private readonly value: number,
		mix?: number,
		id?: string,
	) {
		super(mix, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let panNode = node instanceof StereoPannerNode ? node : undefined;

		if (!panNode) {
			panNode = scheduleContext.audioContext.createStereoPanner();

			if (this.id) {
				const driver = getOrCreateDriver(`${this.id}.value`, this.value, scheduleContext);

				panNode.pan.value = 0;
				driver.connect(panNode.pan);
			} else {
				panNode.pan.value = this.value;
			}

			scheduleContext.nodeMap.set(this.effectsId, panNode);
		}

		audio.connect(panNode);

		this.forward(audio, [panNode], noteContext, scheduleContext);
	}
}

export function pan({ value, mix, id }: { value: number; mix?: number; id?: string }): PanEffectNode {
	return new PanEffectNode(value, mix, id);
}
