import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { MidiAudio, NoteContext } from "../node";
import { Node } from "../node";

export abstract class EffectNode extends Node<MidiAudio, MidiAudio> {
	readonly effectsId: string;

	constructor(
		readonly mix?: number,
		readonly id?: string,
	) {
		super();
		this.effectsId = id ?? crypto.randomUUID();
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(_note: NoteContext, _context: ScheduleContext): void {
		return;
	}

	teardown(_context: ScheduleContext): void {
		return;
	}

	protected forward(audio: AudioNode, tails: ReadonlyArray<AudioNode>, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		if (this.mix === undefined) {
			if (this.outputs.length === 0) {
				for (const tail of tails) {
					tail.connect(scheduleContext.audioContext.destination);
				}
			} else {
				for (const output of this.outputs) {
					for (const tail of tails) {
						output.schedule(tail, noteContext, scheduleContext);
					}
				}
			}
		} else {
			const wetKey = `${this.effectsId}.wet`;
			const dryKey = `${this.effectsId}.dry`;
			const sumKey = `${this.effectsId}.sum`;

			const existingWet = scheduleContext.nodeMap.get(wetKey);

			if (!(existingWet instanceof GainNode)) {
				const wetGain = scheduleContext.audioContext.createGain();
				const dryGain = scheduleContext.audioContext.createGain();
				const sumNode = scheduleContext.audioContext.createGain();
				sumNode.gain.value = 1;

				for (const tail of tails) {
					tail.connect(wetGain);
				}

				wetGain.connect(sumNode);
				dryGain.connect(sumNode);

				if (this.id) {
					const mixDriver = getOrCreateDriver(`${this.id}.mix`, this.mix, scheduleContext);

					wetGain.gain.value = 0;
					mixDriver.connect(wetGain.gain);
					dryGain.gain.value = 1;

					const inverter = scheduleContext.audioContext.createGain();

					inverter.gain.value = -1;
					mixDriver.connect(inverter);
					inverter.connect(dryGain.gain);

					scheduleContext.nodeMap.set(`${this.effectsId}.inverter`, inverter);
				} else {
					wetGain.gain.value = this.mix;
					dryGain.gain.value = 1 - this.mix;
				}

				if (this.outputs.length === 0) {
					sumNode.connect(scheduleContext.audioContext.destination);
				} else {
					for (const output of this.outputs) {
						output.schedule(sumNode, noteContext, scheduleContext);
					}
				}

				scheduleContext.nodeMap.set(wetKey, wetGain);
				scheduleContext.nodeMap.set(dryKey, dryGain);
				scheduleContext.nodeMap.set(sumKey, sumNode);
			}

			const dryGain = scheduleContext.nodeMap.get(dryKey);

			if (dryGain instanceof GainNode) {
				audio.connect(dryGain);
			}
		}
	}

	abstract schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void;
}
