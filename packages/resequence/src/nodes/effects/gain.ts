import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class GainEffectNode extends EffectNode {
	readonly type = "gain" as const;

	constructor(
		private readonly level: number,
		id?: string,
	) {
		super(id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let gainNode = node instanceof GainNode ? node : undefined;

		if (!gainNode) {
			gainNode = scheduleContext.audioContext.createGain();

			if (this.id) {
				const driver = getOrCreateDriver(`${this.id}.level`, dbToLinear(this.level), scheduleContext);
				gainNode.gain.value = 0;
				driver.connect(gainNode.gain);
			} else {
				gainNode.gain.value = dbToLinear(this.level);
			}

			scheduleContext.nodeMap.set(this.effectsId, gainNode);
		}

		this.forward(audio, gainNode, noteContext, scheduleContext);
	}
}

export function gain({ level, id }: { level: number; id?: string }): GainEffectNode {
	return new GainEffectNode(level, id);
}

function dbToLinear(db: number): number {
	return 10 ** (db / 20);
}
