import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam, offsetParam, undriveParam } from "../../utils/driver";
import { scheduleSlideRamps } from "../../utils/schedule-slides";
import type { WaveShape } from "../lfo";
import type { VoiceNote } from "../midi-unit";
import { GeneratorUnit } from "./generator";

export class OscillatorUnit extends GeneratorUnit {
	private readonly oscillatorType: WaveShape;
	private readonly detune: number;
	public readonly id?: string;

	constructor({ type, detune, id }: { type: WaveShape; detune?: number; id?: string }) {
		super();
		this.oscillatorType = type;
		this.detune = detune ?? 0;
		this.id = id;
	}

	protected _schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		const oscillator = scheduleContext.audioContext.createOscillator();
		oscillator.type = this.oscillatorType;

		const frequency = noteToFrequency(voiceNote.note, voiceNote.bend);
		offsetParam(oscillator.frequency, this.id ? `${this.id}.frequency` : undefined, frequency, [20, 20000], scheduleContext);
		driveParam(oscillator.detune, this.id ? `${this.id}.detune` : undefined, this.detune, [-1200, 1200], scheduleContext);

		if (voiceNote.slides && voiceNote.slides.length > 0) {
			scheduleSlideRamps(
				oscillator.detune,
				this.detune,
				voiceNote.slides,
				voiceNote.startMs / 1000,
				(cents) => this.detune + cents,
			);
		}

		oscillator.start(voiceNote.startMs / 1000);
		oscillator.stop(voiceNote.cleanupMs / 1000);

		const cleanup = this.scheduleVoice([oscillator], voiceNote, scheduleContext);

		oscillator.addEventListener("ended", () => {
			if (this.id) {
				undriveParam(`${this.id}.detune`, oscillator.detune, scheduleContext);
			}
			cleanup();
		});
	}
}

function noteToFrequency(note: number, bend: number): number {
	return 440 * 2 ** ((note - 69 + bend / 100) / 12);
}

export function oscillator({ type, detune, id }: { type: WaveShape; detune?: number; id?: string }): OscillatorUnit {
	return new OscillatorUnit({ type, detune, id });
}

export const osc = oscillator;
