import { describe, expect, it } from "vitest";
import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import { humanize } from "./humanize";

class CaptureMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "capture"] as const;
	readonly id = "capture";
	readonly captured: Array<VoiceNote> = [];

	protected _setup(): void {}
	protected _teardown(): void {}
	protected _schedule(voiceNote: VoiceNote): void {
		this.captured.push(voiceNote);
	}
}

const stubContext = {
	audioContext: {} as BaseAudioContext,
	driverMap: new Map(),
	tempoMap: [],
	fromBeats: 0,
	toBeats: Infinity,
} as unknown as ScheduleContext;

function makeVoiceNote(note: number, velocity = 100, startMs = 1000): VoiceNote {
	return { note, bend: 0, velocity, startMs, stopMs: startMs + 500, cleanupMs: startMs + 1000 };
}

describe("HumanizeMidiUnit", () => {
	it("passes notes through with no jitter when both options are 0", () => {
		const unit = humanize({ timing: 0, velocity: 0 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(60), stubContext);

		expect(capture.captured).toHaveLength(1);
		expect(capture.captured[0]?.note).toBe(60);
		expect(capture.captured[0]?.velocity).toBe(100);
		expect(capture.captured[0]?.startMs).toBe(1000);
	});

	it("applies timing jitter within range", () => {
		const unit = humanize({ timing: 50 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);
		unit["_setup"]();

		for (let i = 0; i < 20; i++) {
			unit.schedule(makeVoiceNote(60, 100, 1000), stubContext);
		}

		for (const voiceNote of capture.captured) {
			expect(voiceNote.startMs).toBeGreaterThanOrEqual(950);
			expect(voiceNote.startMs).toBeLessThanOrEqual(1050);
		}
	});

	it("applies velocity jitter within range", () => {
		const unit = humanize({ velocity: 20 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);
		unit["_setup"]();

		for (let i = 0; i < 20; i++) {
			unit.schedule(makeVoiceNote(60, 100), stubContext);
		}

		for (const voiceNote of capture.captured) {
			expect(voiceNote.velocity).toBeGreaterThanOrEqual(80);
			expect(voiceNote.velocity).toBeLessThanOrEqual(120);
		}
	});

	it("clamps velocity to valid MIDI range", () => {
		const unit = humanize({ velocity: 50 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);
		unit["_setup"]();

		for (let i = 0; i < 20; i++) {
			unit.schedule(makeVoiceNote(60, 5), stubContext);
		}

		for (const voiceNote of capture.captured) {
			expect(voiceNote.velocity).toBeGreaterThanOrEqual(1);
			expect(voiceNote.velocity).toBeLessThanOrEqual(127);
		}
	});

	it("clamps startMs to non-negative", () => {
		const unit = humanize({ timing: 100 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);
		unit["_setup"]();

		for (let i = 0; i < 20; i++) {
			unit.schedule(makeVoiceNote(60, 100, 50), stubContext);
		}

		for (const voiceNote of capture.captured) {
			expect(voiceNote.startMs).toBeGreaterThanOrEqual(0);
		}
	});
});
