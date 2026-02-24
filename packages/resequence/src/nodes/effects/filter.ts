import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export type FilterMode = "lowpass" | "highpass" | "bandpass" | "peaking" | "notch" | "lowshelf" | "highshelf";

export class FilterEffectNode extends EffectNode {
	readonly type = "filter" as const;

	constructor(
		private readonly mode: FilterMode,
		private readonly frequency: number,
		private readonly resonance: number | undefined,
		id?: string,
	) {
		super(id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let filterNode = node instanceof BiquadFilterNode ? node : undefined;

		if (!filterNode) {
			filterNode = scheduleContext.audioContext.createBiquadFilter();
			filterNode.type = this.mode;
			filterNode.frequency.value = this.frequency;

			if (this.resonance !== undefined) filterNode.Q.value = this.resonance;

			if (this.id) {
				const freqDriver = getOrCreateDriver(`${this.id}.frequency`, this.frequency, scheduleContext);
				filterNode.frequency.value = 0;
				freqDriver.connect(filterNode.frequency);

				const resDriver = getOrCreateDriver(`${this.id}.resonance`, this.resonance ?? 1, scheduleContext);
				filterNode.Q.value = 0;
				resDriver.connect(filterNode.Q);
			}

			scheduleContext.nodeMap.set(this.effectsId, filterNode);
		}

		this.forward(audio, filterNode, noteContext, scheduleContext);
	}
}

export function filter({ mode, frequency, resonance, id }: { mode: FilterMode; frequency: number; resonance?: number; id?: string }): FilterEffectNode {
	return new FilterEffectNode(mode, frequency, resonance, id);
}

export function highpass({ frequency, resonance, id }: { frequency: number; resonance?: number; id?: string }): FilterEffectNode {
	return filter({ mode: "highpass", frequency, resonance, id });
}

export function lowpass({ frequency, resonance, id }: { frequency: number; resonance?: number; id?: string }): FilterEffectNode {
	return filter({ mode: "lowpass", frequency, resonance, id });
}
