import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
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
		driveParam(oscillator.frequency, this.id, "frequency", frequency, scheduleContext);
		driveParam(oscillator.detune, this.id, "detune", this.detune, scheduleContext);

		oscillator.start(voiceNote.startMs / 1000);
		oscillator.stop(voiceNote.cleanupMs / 1000);

		const cleanup = this.scheduleVoice([oscillator], voiceNote, scheduleContext);

		oscillator.addEventListener("ended", () => {
			if (this.id) {
				scheduleContext.driverMap.get(`${this.id}.frequency`)?.disconnect(oscillator.frequency);
				scheduleContext.driverMap.get(`${this.id}.detune`)?.disconnect(oscillator.detune);
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
