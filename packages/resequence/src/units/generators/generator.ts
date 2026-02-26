import type { ScheduleContext } from "../../rendering/schedule-context";
import { CCEffectUnit } from "../effects/cc";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { Unit } from "../unit";

export abstract class GeneratorUnit extends MidiUnit {
	public mergeUnit: GainEffectUnit | undefined;

	private voiceToCallbacks: Array<(voiceNote: VoiceNote) => Unit> = [];

	voiceTo(callback: (voiceNote: VoiceNote) => Unit): this {
		this.voiceToCallbacks.push(callback);
		return this;
	}

	protected _setup(context: ScheduleContext): void {
		const mergeUnit = linearGain({ level: 1 });

		for (const target of this.targets) mergeUnit.to(target);
		mergeUnit.setup(context);

		this.entryNodes.push(...mergeUnit.entryNodes);
		this.mergeUnit = mergeUnit;
	}

	protected _teardown(context: ScheduleContext): void {
		this.mergeUnit?.teardown(context);
		this.mergeUnit = undefined;
	}

	protected scheduleVoice(sourceNodes: Array<AudioNode>, voiceNote: VoiceNote, scheduleContext: ScheduleContext): () => void {
		if (!this.mergeUnit) return () => {};

		const ccEffect = new CCEffectUnit(voiceNote);

		if (this.voiceToCallbacks.length > 0) {
			for (const callback of this.voiceToCallbacks) {
				const voiceUnit = callback(voiceNote);
				ccEffect.to(voiceUnit);
				voiceUnit.to(this.mergeUnit);
			}
		} else {
			ccEffect.to(this.mergeUnit);
		}

		ccEffect.setup(scheduleContext);
		ccEffect.schedule(voiceNote, scheduleContext);

		for (const source of sourceNodes) {
			for (const entry of ccEffect.entryNodes) {
				source.connect(entry);
			}
		}

		return (): void => {
			for (const source of sourceNodes) {
				source.disconnect();
			}
			ccEffect.teardown(scheduleContext);
		};
	}
}
