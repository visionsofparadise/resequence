import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../utils/driver";
import { buildCurve } from "../build-curve";
import { CCEffectUnit } from "../effects/cc";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { ModDeclaration, Unit } from "../unit";

export abstract class GeneratorUnit extends MidiUnit {
	public mergeUnit: GainEffectUnit | undefined;

	private readonly voiceToCallbacks: Array<(voiceNote: VoiceNote) => Unit> = [];
	private readonly voiceModDeclarations: Array<ModDeclaration> = [];

	voiceTo(callback: (voiceNote: VoiceNote) => Unit): this {
		this.voiceToCallbacks.push(callback);
		return this;
	}

	voiceMod(paths: Array<string>, transform?: (value: number) => number): void {
		this.voiceModDeclarations.push({ paths, transform });
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

		const voiceShapers: Array<AudioNode> = [];

		if (this.voiceModDeclarations.length > 0) {
			for (const decl of this.voiceModDeclarations) {
				for (const path of decl.paths) {
					const driver = getOrCreateDriver(path, 0, scheduleContext);

					if (decl.transform) {
						const shaper = scheduleContext.audioContext.createWaveShaper();
						shaper.curve = buildCurve(decl.transform);
						shaper.connect(driver.offset);
						voiceShapers.push(shaper);

						for (const source of sourceNodes) {
							source.connect(shaper);
						}
					} else {
						for (const source of sourceNodes) {
							source.connect(driver.offset);
						}
					}
				}
			}
		}

		return (): void => {
			for (const source of sourceNodes) {
				source.disconnect();
			}

			for (const shaper of voiceShapers) {
				shaper.disconnect();
			}

			ccEffect.teardown(scheduleContext);
		};
	}
}
