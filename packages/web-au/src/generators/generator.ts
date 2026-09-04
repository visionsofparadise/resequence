import { MidiUnit } from "@resequence/web-au-core";
import { CCEffectUnit } from "../effects/cc";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import type { AnyUnit, ModDeclaration, NoteEvent, SetupResult, UnitContext } from "@resequence/web-au-core";
import type { z } from "zod";

export abstract class GeneratorUnit<S extends z.ZodObject = z.ZodObject> extends MidiUnit<S> {
	readonly voiceToCallbacks: Array<(noteEvent: NoteEvent) => AnyUnit> = [];
	readonly voiceModDeclarations: Array<ModDeclaration> = [];
	public mergeUnit: GainEffectUnit | undefined;

	voiceTo(callback: (noteEvent: NoteEvent) => AnyUnit): this {
		this.voiceToCallbacks.push(callback);

		return this;
	}

	voiceMod(paths: Array<string>, transform?: (value: number) => number): void {
		this.voiceModDeclarations.push({ paths, transform });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const mergeUnit = linearGain({ level: 1 });

		await mergeUnit.setup(context);

		this.mergeUnit = mergeUnit;

		return { entries: [], exits: [mergeUnit] };
	}

	protected override _teardown(context: UnitContext): void {
		this.mergeUnit?.teardown(context);
		this.mergeUnit = undefined;
	}

	protected offsetNote(noteEvent: NoteEvent, context: UnitContext): NoteEvent {
		if (context.latencyBudget === 0) return noteEvent;

		const offsetMs = (context.latencyBudget / context.audioContext.sampleRate) * 1000;

		return {
			...noteEvent,
			startMs: noteEvent.startMs + offsetMs,
			stopMs: noteEvent.stopMs + offsetMs,
			cleanupMs: noteEvent.cleanupMs + offsetMs,
		};
	}

	protected scheduleVoice(exits: Array<AudioNode>, noteEvent: NoteEvent, context: UnitContext): () => void {
		if (!this.mergeUnit) return () => {};

		const ccEffect = new CCEffectUnit({ noteEvent });

		const chainHead: AnyUnit = ccEffect;
		let chainTail: AnyUnit = ccEffect;

		if (this.voiceToCallbacks.length > 0) {
			for (const callback of this.voiceToCallbacks) {
				const voiceUnit = callback(noteEvent);

				chainTail.to(voiceUnit);
				chainTail = voiceUnit;
			}
		}

		chainTail.to(this.mergeUnit);

		for (const decl of this.voiceModDeclarations) {
			chainTail.mod(decl.paths, decl.transform);
		}

		void chainHead.setup(context);

		for (const exit of exits) {
			for (const entry of chainHead.entryNodes) {
				exit.connect(entry);
			}
		}

		return (): void => {
			for (const exit of exits) {
				exit.disconnect();
			}

			chainHead.teardown(context);
		};
	}
}
