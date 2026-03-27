import type { NoteEvent, SetupResult, UnitContext } from "@resequence/web-au-core";
import type { WaveShape } from "../lfo";

import { driveParam, getOrCreateDriver, offsetParam } from "@resequence/web-au-core";
import { scheduleSlideRamps } from "@resequence/web-au-utils";
import { GeneratorUnit, type GeneratorUnitInput, type GeneratorUnitProperties } from "./generator";

export interface OscillatorProperties extends GeneratorUnitProperties {
	readonly oscillatorType: WaveShape;
	readonly detune?: number;
	readonly previousProperties?: OscillatorProperties;
}

export class OscillatorUnit extends GeneratorUnit {
	readonly type = ["unit", "midi", "generator", "oscillator"] as const;

	declare readonly properties: OscillatorProperties;

	static override is(value: unknown): value is OscillatorUnit {
		return GeneratorUnit.is(value) && value.type[3] === "oscillator";
	}

	constructor(properties: GeneratorUnitInput<OscillatorProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
			voiceToCallbacks: properties.voiceToCallbacks ?? [],
			voiceModDeclarations: properties.voiceModDeclarations ?? [],
			detune: properties.detune ?? 0,
		};
	}

	get oscillatorType(): WaveShape {
		return this.properties.oscillatorType;
	}
	get detune(): number {
		return this.properties.detune ?? 0;
	}

	clone(overrides?: Partial<OscillatorProperties>): OscillatorUnit {
		return new OscillatorUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const result = await super._setup(context);

		if (this.id) {
			getOrCreateDriver(`${this.id}.frequency`, 0, context, [20, 20000]);
			const normalized = (this.detune - -1200) / (1200 - -1200);

			getOrCreateDriver(`${this.id}.detune`, normalized, context, [-1200, 1200]);
		}

		return result;
	}

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const ne = this.offsetNote(noteEvent, context);
		const oscillator = context.audioContext.createOscillator();

		oscillator.type = this.oscillatorType;

		const frequency = noteToFrequency(ne.note, ne.bend);

		offsetParam(oscillator.frequency, this.id ? `${this.id}.frequency` : undefined, frequency, [20, 20000], context);
		driveParam(oscillator.detune, this.id ? `${this.id}.detune` : undefined, this.detune, [-1200, 1200], context);

		if (ne.slides && ne.slides.length > 0) {
			scheduleSlideRamps(oscillator.detune, this.detune, ne.slides, ne.startMs / 1000, (cents) => this.detune + cents);
		}

		oscillator.start(ne.startMs / 1000);
		oscillator.stop(ne.cleanupMs / 1000);

		const cleanup = this.scheduleVoice([oscillator], ne, context);

		oscillator.addEventListener("ended", cleanup);
	}
}

function noteToFrequency(note: number, bend: number): number {
	return 440 * 2 ** ((note - 69 + bend / 100) / 12);
}

export function oscillator({ type, detune, id }: { type: WaveShape; detune?: number; id?: string }): OscillatorUnit {
	return new OscillatorUnit({ oscillatorType: type, detune, id });
}

export const osc = oscillator;
