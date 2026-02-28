import type { ScheduleContext } from "../../rendering/schedule-context";
import { beatsToSeconds } from "../../rendering/tempo-map";
import type { VoiceNote, VoiceSlide } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { SetupResult } from "../unit";

interface LastPitch {
	readonly note: number;
	readonly bend: number;
	readonly slides?: ReadonlyArray<VoiceSlide>;
}

export class PortamentoUnit extends MidiUnit {
	private lastPitch: LastPitch | undefined;
	private readonly timeBeats: number;

	constructor(timeBeats: number) {
		super();
		this.timeBeats = timeBeats;
	}

	schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		const modified = this.applyPortamento(voiceNote, scheduleContext);

		for (const target of this.targets) {
			if (target instanceof MidiUnit) target.schedule(modified, scheduleContext);
		}

		this.lastPitch = {
			note: voiceNote.note,
			bend: voiceNote.bend,
			slides: modified.slides,
		};
	}

	protected _setup(_context: ScheduleContext): SetupResult {
		this.lastPitch = undefined;
		return {};
	}

	private applyPortamento(voiceNote: VoiceNote, scheduleContext: ScheduleContext): VoiceNote {
		if (!this.lastPitch) return voiceNote;

		// Compute previous note's end pitch in absolute MIDI-note space
		let prevAbsolute = this.lastPitch.note + this.lastPitch.bend / 100;

		if (this.lastPitch.slides && this.lastPitch.slides.length > 0) {
			const lastSlide = this.lastPitch.slides[this.lastPitch.slides.length - 1];
			if (lastSlide) prevAbsolute += lastSlide.cents / 100;
		}

		// Current note's absolute pitch
		const currentAbsolute = voiceNote.note + voiceNote.bend / 100;

		// Glide distance in cents
		const glideStartCents = (prevAbsolute - currentAbsolute) * 100;

		if (Math.abs(glideStartCents) < 0.01) return voiceNote;

		// Resolve portamento time to ms
		// Use beatsToSeconds at the note's position in time, approximated by finding the beat
		const noteDurationMs = voiceNote.stopMs - voiceNote.startMs;
		const glideTimeMs = Math.min(this.resolveTimeMs(scheduleContext), noteDurationMs);

		// Create portamento slides
		const portaSlides: Array<VoiceSlide> = [
			{ timeMs: 0, cents: glideStartCents, curve: 0 },
			{ timeMs: glideTimeMs, cents: 0, curve: 0 },
		];

		if (!voiceNote.slides || voiceNote.slides.length === 0) {
			return { ...voiceNote, slides: portaSlides };
		}

		// Merge: portamento keyframes first, then existing slides after glide time
		const merged: Array<VoiceSlide> = [...portaSlides];

		for (const existing of voiceNote.slides) {
			if (existing.timeMs > glideTimeMs) {
				merged.push(existing);
			}
		}

		return { ...voiceNote, slides: merged };
	}

	private resolveTimeMs(scheduleContext: ScheduleContext): number {
		// Convert beats to seconds using the first tempo point
		return beatsToSeconds(this.timeBeats, scheduleContext.tempoMap) * 1000;
	}
}

export function portamento(options: { timeBeats: number }): PortamentoUnit {
	return new PortamentoUnit(options.timeBeats);
}

export const porta = portamento;
