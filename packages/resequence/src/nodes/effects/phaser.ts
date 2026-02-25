import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export class PhaserEffectNode extends EffectNode {
	constructor(
		private readonly stages: number,
		private readonly rate: number,
		private readonly depth: number,
		mix?: number,
		id?: string,
	) {
		super(mix ?? 0.5, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const node = scheduleContext.nodeMap.get(this.effectsId);

		let firstFilter = node instanceof BiquadFilterNode ? node : undefined;

		if (!firstFilter) {
			const filters: Array<BiquadFilterNode> = [];

			for (let stage = 0; stage < this.stages; stage++) {
				const filterNode = scheduleContext.audioContext.createBiquadFilter();

				filterNode.type = "allpass";
				filterNode.frequency.value = 1000;
				filters.push(filterNode);
			}

			for (let stage = 0; stage < filters.length - 1; stage++) {
				filters[stage]!.connect(filters[stage + 1]!);
			}

			const lfo = scheduleContext.audioContext.createOscillator();

			lfo.type = "sine";
			lfo.frequency.value = this.rate;

			const depthGain = scheduleContext.audioContext.createGain();

			depthGain.gain.value = this.depth;

			lfo.connect(depthGain);

			for (const filterNode of filters) {
				depthGain.connect(filterNode.frequency);
			}

			lfo.start(scheduleContext.audioContext.currentTime);

			if (this.id) {
				const rateDriver = getOrCreateDriver(`${this.id}.rate`, this.rate, scheduleContext);
				lfo.frequency.value = 0;
				rateDriver.connect(lfo.frequency);

				const depthDriver = getOrCreateDriver(`${this.id}.depth`, this.depth, scheduleContext);
				depthGain.gain.value = 0;
				depthDriver.connect(depthGain.gain);
			}

			firstFilter = filters[0]!;
			const lastFilter = filters[filters.length - 1]!;

			scheduleContext.nodeMap.set(this.effectsId, firstFilter);
			scheduleContext.nodeMap.set(`${this.effectsId}.last`, lastFilter);
			scheduleContext.nodeMap.set(`${this.effectsId}.lfo`, lfo);
			scheduleContext.nodeMap.set(`${this.effectsId}.depth`, depthGain);
		}

		const lastFilter = scheduleContext.nodeMap.get(`${this.effectsId}.last`);
		const tail = lastFilter instanceof BiquadFilterNode ? lastFilter : firstFilter;

		audio.connect(firstFilter);

		this.forward(audio, [tail], noteContext, scheduleContext);
	}
}

export function phaser({ stages, rate, depth, mix, id }: { stages: number; rate: number; depth: number; mix?: number; id?: string }): PhaserEffectNode {
	return new PhaserEffectNode(stages, rate, depth, mix, id);
}
