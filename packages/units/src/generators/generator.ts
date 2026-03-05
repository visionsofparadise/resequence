import type { UnitContext } from "../context";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import type { MidiUnitProperties } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { NoteEvent } from "../note-event";
import type { ModDeclaration, SetupResult, Unit } from "../unit";

export interface GeneratorUnitProperties extends MidiUnitProperties {
	readonly voiceToCallbacks: Array<(noteEvent: NoteEvent) => Unit>;
	readonly voiceModDeclarations: Array<ModDeclaration>;
}

type OptionalGeneratorKeys = "targets" | "modDeclarations" | "noteModDeclarations" | "voiceToCallbacks" | "voiceModDeclarations";

export type GeneratorUnitInput<P extends GeneratorUnitProperties = GeneratorUnitProperties> = Omit<P, OptionalGeneratorKeys> & Partial<Pick<P, OptionalGeneratorKeys>>;

export abstract class GeneratorUnit extends MidiUnit {
	abstract readonly type: readonly ["unit", "midi", "generator", ...Array<string>];
	declare readonly properties: GeneratorUnitProperties;
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
		this.properties.voiceToCallbacks.push(callback);

		return this;
	}

	voiceMod(paths: Array<string>, transform?: (value: number) => number): void {
		this.properties.voiceModDeclarations.push({ paths, transform });
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

	protected scheduleVoice(exits: Array<AudioNode>, noteEvent: NoteEvent, context: UnitContext): () => void {
		if (!this.mergeUnit) return () => {};

		// TODO: CCEffectUnit — ported with unit library
		// When CCEffectUnit is available, insert it here:
		//   const ccEffect = new CCEffectUnit({ noteEvent });
		//   source exits → ccEffect → voiceTo chain → mergeUnit
		// For now, source exits connect directly to voiceTo chain or mergeUnit.

		let chainHead: Unit | undefined;
		let chainTail: Unit | undefined;

		if (this.properties.voiceToCallbacks.length > 0) {
			for (const callback of this.properties.voiceToCallbacks) {
				const voiceUnit = callback(noteEvent);
				if (chainHead) {
					chainTail?.to(voiceUnit);
				} else {
					chainHead = voiceUnit;
				}
				chainTail = voiceUnit;
			}
			chainTail?.to(this.mergeUnit);
		}

		const connectTarget = chainHead ?? this.mergeUnit;

		if (chainHead) {
			for (const decl of this.properties.voiceModDeclarations) {
				(chainTail ?? chainHead).mod(decl.paths, decl.transform);
			}
		}

		void connectTarget.setup(context);

		for (const exit of exits) {
			for (const entry of connectTarget.entryNodes) {
				exit.connect(entry);
			}
		}

		return (): void => {
			for (const exit of exits) {
				exit.disconnect();
			}
			if (chainHead) {
				chainHead.teardown(context);
			}
		};
	}
}
