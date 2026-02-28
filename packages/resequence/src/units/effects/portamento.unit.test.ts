import { describe, expect, it } from "vitest";
import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote, VoiceSlide } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import { PortamentoUnit, porta, portamento } from "./portamento";

// Minimal mock MidiUnit that captures scheduled VoiceNotes
class CaptureMidiUnit extends MidiUnit {
	readonly id = "capture";
	readonly captured: Array<VoiceNote> = [];

	protected _setup(): void {}
	protected _teardown(): void {}

	protected _schedule(voiceNote: VoiceNote): void {
		this.captured.push(voiceNote);
	}
}

// Minimal ScheduleContext stub (portamento only uses tempoMap)
const stubContext: ScheduleContext = {
	audioContext: {} as BaseAudioContext,
	sampleMap: new Map(),
	driverMap: new Map(),
	tempoMap: [{ beat: 0, bpm: 120 }],
	fromBeats: 0,
	toBeats: Infinity,
};

function makeVoiceNote(note: number, startMs: number, stopMs: number, slides?: ReadonlyArray<VoiceSlide>): VoiceNote {
	return {
		note,
		bend: 0,
		velocity: 100,
		startMs,
		stopMs,
		cleanupMs: stopMs + 500,
		slides,
	};
}

describe("PortamentoUnit", () => {
	it("creates a PortamentoUnit instance", () => {
		const unit = portamento({ timeBeats: 0.5 });
		expect(unit).toBeInstanceOf(PortamentoUnit);
	});

	it("porta alias creates same unit", () => {
		const unit = porta({ timeBeats: 1 });
		expect(unit).toBeInstanceOf(PortamentoUnit);
	});

	it("first note has no slides", () => {
		const unit = portamento({ timeBeats: 0.5 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		// Reset state
		unit["lastPitch"] = undefined;

		const voiceNote = makeVoiceNote(60, 0, 500);
		unit.schedule(voiceNote, stubContext);

		expect(capture.captured).toHaveLength(1);
		expect(capture.captured[0]!.slides).toBeUndefined();
	});

	it("second note gets portamento slides from previous pitch", () => {
		const unit = portamento({ timeBeats: 0.5 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		// First note: C4 (MIDI 60)
		unit.schedule(makeVoiceNote(60, 0, 500), stubContext);

		// Second note: E4 (MIDI 64)
		unit.schedule(makeVoiceNote(64, 500, 1000), stubContext);

		expect(capture.captured).toHaveLength(2);
		const secondNote = capture.captured[1]!;
		expect(secondNote.slides).toBeDefined();
		expect(secondNote.slides).toHaveLength(2);
		// Glide starts at previous pitch: 60 - 64 = -4 semitones = -400 cents
		expect(secondNote.slides![0]!.timeMs).toBe(0);
		expect(secondNote.slides![0]!.cents).toBe(-400);
		// Arrives at own pitch (0 cents) by glide time
		expect(secondNote.slides![1]!.cents).toBe(0);
	});

	it("portamento time is clamped to note duration", () => {
		// portamento time = 1 beat = 500ms at 120bpm
		const unit = portamento({ timeBeats: 1 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		// First note
		unit.schedule(makeVoiceNote(60, 0, 500), stubContext);

		// Second note: only 200ms long
		unit.schedule(makeVoiceNote(64, 500, 700), stubContext);

		const secondNote = capture.captured[1]!;
		expect(secondNote.slides).toBeDefined();
		// Glide time should be clamped to 200ms (note duration)
		expect(secondNote.slides![1]!.timeMs).toBe(200);
	});

	it("same pitch consecutive notes get no slides", () => {
		const unit = portamento({ timeBeats: 0.5 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		unit.schedule(makeVoiceNote(60, 0, 500), stubContext);
		unit.schedule(makeVoiceNote(60, 500, 1000), stubContext);

		const secondNote = capture.captured[1]!;
		expect(secondNote.slides).toBeUndefined();
	});

	it("previous note with slides: portamento starts from slide endpoint", () => {
		const unit = portamento({ timeBeats: 0.5 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		// First note: C4 with slide to E4 (+400 cents)
		const slidingNote = makeVoiceNote(60, 0, 500, [
			{ timeMs: 0, cents: 0, curve: 0 },
			{ timeMs: 250, cents: 400, curve: 0 },
		]);
		unit.schedule(slidingNote, stubContext);

		// Second note: G4 (MIDI 67)
		unit.schedule(makeVoiceNote(67, 500, 1000), stubContext);

		const secondNote = capture.captured[1]!;
		expect(secondNote.slides).toBeDefined();
		// Previous ended at MIDI 60 + 400/100 = 64 (E4)
		// Current is 67 (G4), so glide = (64 - 67) * 100 = -300 cents
		expect(secondNote.slides![0]!.cents).toBe(-300);
	});

	it("state resets on setup", () => {
		const unit = portamento({ timeBeats: 0.5 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		// Set some state
		unit["lastPitch"] = { note: 60, bend: 0 };

		// Setup should reset
		unit["_setup"](stubContext);

		// First note after reset should have no slides
		unit.schedule(makeVoiceNote(64, 0, 500), stubContext);
		expect(capture.captured[0]!.slides).toBeUndefined();
	});
});
