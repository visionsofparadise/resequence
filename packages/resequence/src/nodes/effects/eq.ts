import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

export interface EqBand {
	readonly type: BiquadFilterType;
	readonly frequency: number;
	readonly gain?: number;
	readonly q?: number;
	readonly id?: string;
}

export class EqEffectNode extends EffectNode {
	constructor(
		private readonly bands: ReadonlyArray<EqBand>,
		mix?: number,
		id?: string,
	) {
		super(mix, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const firstKey = `${this.effectsId}.band.0`;
		const node = scheduleContext.nodeMap.get(firstKey);

		let firstFilter = node instanceof BiquadFilterNode ? node : undefined;

		if (!firstFilter) {
			const filters: Array<BiquadFilterNode> = [];

			for (let bandIndex = 0; bandIndex < this.bands.length; bandIndex++) {
				const band = this.bands[bandIndex]!;
				const filterNode = scheduleContext.audioContext.createBiquadFilter();

				filterNode.type = band.type;
				filterNode.frequency.value = band.frequency;

				if (band.gain !== undefined) filterNode.gain.value = band.gain;
				if (band.q !== undefined) filterNode.Q.value = band.q;

				if (band.id) {
					const freqDriver = getOrCreateDriver(`${band.id}.frequency`, band.frequency, scheduleContext);

					filterNode.frequency.value = 0;
					freqDriver.connect(filterNode.frequency);

					if (band.gain !== undefined) {
						const gainDriver = getOrCreateDriver(`${band.id}.gain`, band.gain, scheduleContext);

						filterNode.gain.value = 0;
						gainDriver.connect(filterNode.gain);
					}

					if (band.q !== undefined) {
						const qDriver = getOrCreateDriver(`${band.id}.q`, band.q, scheduleContext);

						filterNode.Q.value = 0;
						qDriver.connect(filterNode.Q);
					}
				}

				scheduleContext.nodeMap.set(`${this.effectsId}.band.${bandIndex}`, filterNode);
				filters.push(filterNode);
			}

			for (let bandIndex = 0; bandIndex < filters.length - 1; bandIndex++) {
				filters[bandIndex]!.connect(filters[bandIndex + 1]!);
			}

			firstFilter = filters[0]!;
		}

		const lastKey = `${this.effectsId}.band.${this.bands.length - 1}`;
		const lastNode = scheduleContext.nodeMap.get(lastKey);
		const lastFilter = lastNode instanceof BiquadFilterNode ? lastNode : firstFilter;

		audio.connect(firstFilter);

		this.forward(audio, [lastFilter], noteContext, scheduleContext);
	}
}

export function eq({ bands, mix, id }: { bands: ReadonlyArray<EqBand>; mix?: number; id?: string }): EqEffectNode {
	return new EqEffectNode(bands, mix, id);
}
