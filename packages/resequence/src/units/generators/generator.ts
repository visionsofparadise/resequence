import type { ScheduleContext } from "../../rendering/schedule-context";
import { CCEffectUnit } from "../effects/cc";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { ModDeclaration, SetupResult, Unit } from "../unit";

export abstract class GeneratorUnit extends MidiUnit {
	abstract readonly type: readonly ["unit", "midi", "generator", ...Array<string>];
	public mergeUnit: GainEffectUnit | undefined;

	static is(value: unknown): value is GeneratorUnit {
		return MidiUnit.is(value) && value.type[2] === "generator";
	}

	private readonly voiceToCallbacks: Array<(voiceNote: VoiceNote) => Unit> = [];
	private readonly voiceModDeclarations: Array<ModDeclaration> = [];

	voiceTo(callback: (voiceNote: VoiceNote) => Unit): this {
		this.voiceToCallbacks.push(callback);
		return this;
	}

	voiceMod(paths: Array<string>, transform?: (value: number) => number): void {
		this.voiceModDeclarations.push({ paths, transform });
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		const mergeUnit = linearGain({ level: 1 });

		await mergeUnit.setup(context);

		this.mergeUnit = mergeUnit;

		return { entries: [], exits: [mergeUnit] };
	}

	protected _teardown(context: ScheduleContext): void {
		this.mergeUnit?.teardown(context);
		this.mergeUnit = undefined;
	}

	protected scheduleVoice(exits: Array<AudioNode>, voiceNote: VoiceNote, context: ScheduleContext): () => void {
		if (!this.mergeUnit) return () => {};

		const ccEffect = new CCEffectUnit(voiceNote);
		let modTarget: Unit = ccEffect;

		if (this.voiceToCallbacks.length > 0) {
			for (const callback of this.voiceToCallbacks) {
				const voiceUnit = callback(voiceNote);
				ccEffect.to(voiceUnit);
				voiceUnit.to(this.mergeUnit);
				modTarget = voiceUnit;
			}
		} else {
			ccEffect.to(this.mergeUnit);
		}

		for (const decl of this.voiceModDeclarations) {
			modTarget.mod(decl.paths, decl.transform);
		}

		// Setup is synchronous when all CC chain units have sync _setup (common case)
		void ccEffect.setup(context);
		ccEffect.schedule(voiceNote, context);

		for (const exit of exits) {
			for (const entry of ccEffect.entryNodes) {
				exit.connect(entry);
			}
		}

		return (): void => {
			for (const exit of exits) {
				exit.disconnect();
			}
			ccEffect.teardown(context);
		};
	}
}
