import type { MidiUnitProperties, ModDeclaration, NoteEvent, SetupResult, Unit, UnitContext } from "@resequence/web-au-core";
import { MidiUnit } from "@resequence/web-au-core";
import { CCEffectUnit } from "../effects/cc";
import { linearGain, type GainEffectUnit } from "../effects/gain";

export interface GeneratorUnitProperties extends MidiUnitProperties {
	readonly voiceToCallbacks: Array<(noteEvent: NoteEvent) => Unit>;
	readonly voiceModDeclarations: Array<ModDeclaration>;
}

type OptionalGeneratorKeys = "targets" | "modDeclarations" | "noteModDeclarations" | "voiceToCallbacks" | "voiceModDeclarations";

export type GeneratorUnitInput<P extends GeneratorUnitProperties = GeneratorUnitProperties> = Omit<P, OptionalGeneratorKeys> & Partial<Pick<P, OptionalGeneratorKeys>>;

export abstract class GeneratorUnit extends MidiUnit {
	abstract readonly type: readonly ["unit", "midi", "generator", ...Array<string>];
	declare properties: GeneratorUnitProperties;
	public mergeUnit: GainEffectUnit | undefined;

	static override is(value: unknown): value is GeneratorUnit {
		return MidiUnit.is(value) && value.type[2] === "generator";
	}

	constructor(properties?: GeneratorUnitInput) {
		super(properties);

		this.properties = {
			...properties,
			targets: properties?.targets ?? [],
			modDeclarations: properties?.modDeclarations ?? [],
			noteModDeclarations: properties?.noteModDeclarations ?? [],
			voiceToCallbacks: properties?.voiceToCallbacks ?? [],
			voiceModDeclarations: properties?.voiceModDeclarations ?? [],
		};
	}

	voiceTo(callback: (noteEvent: NoteEvent) => Unit): this {
		this.properties = { ...this.properties, voiceToCallbacks: [...this.properties.voiceToCallbacks, callback] };

		return this;
	}

	voiceMod(paths: Array<string>, transform?: (value: number) => number): void {
		this.properties = { ...this.properties, voiceModDeclarations: [...this.properties.voiceModDeclarations, { paths, transform }] };
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

		return { ...noteEvent, startMs: noteEvent.startMs + offsetMs, stopMs: noteEvent.stopMs + offsetMs, cleanupMs: noteEvent.cleanupMs + offsetMs };
	}

	protected scheduleVoice(exits: Array<AudioNode>, noteEvent: NoteEvent, context: UnitContext): () => void {
		if (!this.mergeUnit) return () => {};

		const ccEffect = new CCEffectUnit({ noteEvent });

		const chainHead: Unit = ccEffect;
		let chainTail: Unit = ccEffect;

		if (this.properties.voiceToCallbacks.length > 0) {
			for (const callback of this.properties.voiceToCallbacks) {
				const voiceUnit = callback(noteEvent);

				chainTail.to(voiceUnit);
				chainTail = voiceUnit;
			}
		}

		chainTail.to(this.mergeUnit);

		for (const decl of this.properties.voiceModDeclarations) {
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
