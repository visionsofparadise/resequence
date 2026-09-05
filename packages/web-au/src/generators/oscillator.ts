import { LiveParameter, driveParam, getOrCreateDriver, live, offsetParam } from "@resequence/web-au-core";
import { scheduleSlideRamps } from "@resequence/web-au-utils";
import { z } from "zod";
import { GeneratorUnit } from "./generator";
import type { WaveShape } from "../lfo";
import type { NoteEvent, SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

const oscillatorSchema = z.object({
	oscillatorType: z.enum(["sine", "square", "sawtooth", "triangle"]).default("sine").describe("Waveform"),
	detune: live(z.number().min(-1200).max(1200).default(0).describe("Detune (cents)")),
});

export class OscillatorUnit extends GeneratorUnit<typeof oscillatorSchema> {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "oscillator";

	constructor(input: z.infer<typeof oscillatorSchema> & UnitInput) {
		super(input, oscillatorSchema);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const result = await super._setup(context);

		if (this.id) {
			getOrCreateDriver(`${this.id}.frequency`, 0, context, [20, 20000]);
		}

		return result;
	}

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const ne = this.offsetNote(noteEvent, context);
		const oscillator = context.audioContext.createOscillator();

		oscillator.type = this.parameters.oscillatorType.value;

		const frequency = noteToFrequency(ne.note, ne.bend);

		const freqParam = new LiveParameter(this.id ? `${this.id}.frequency` : null, frequency, 20, 20000);

		offsetParam(oscillator.frequency, freqParam, undefined, context);

		driveParam(oscillator.detune, this.parameters.detune, undefined, context);

		if (ne.slides && ne.slides.length > 0) {
			scheduleSlideRamps(
				oscillator.detune,
				this.parameters.detune.value,
				ne.slides,
				ne.startMs / 1000,
				(cents) => this.parameters.detune.value + cents,
			);
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

export function oscillator({
	type,
	detune = 0,
	id,
}: {
	type: WaveShape;
	detune?: number;
	id?: string;
}): OscillatorUnit {
	return new OscillatorUnit({ oscillatorType: type, detune, id });
}

export const osc = oscillator;
