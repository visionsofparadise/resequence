import { describe, expect, it } from "vitest";
import type { ScheduleContext } from "../../rendering/schedule-context";
import { MidiUnit } from "../midi-unit";
import type { VoiceNote } from "../midi-unit";
import { velocityCurve } from "./velocity-curve";

class CaptureMidiUnit extends MidiUnit {
	readonly type = "capture" as const;
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
	sampleMap: new Map(),
	driverMap: new Map(),
	tempoMap: [],
	fromBeats: 0,
	toBeats: Infinity,
} as unknown as ScheduleContext;

function makeVoiceNote(note: number, velocity = 100): VoiceNote {
	return { note, bend: 0, velocity, startMs: 0, stopMs: 500, cleanupMs: 1000 };
}

describe("VelocityCurveMidiUnit", () => {
	it("applies an exponential velocity curve", () => {
		const unit = velocityCurve((v) => (v * v) / 127);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(60, 100), stubContext);

		expect(capture.captured[0]?.velocity).toBe(Math.round((100 * 100) / 127));
	});

	it("clamps velocity to valid MIDI range", () => {
		const unit = velocityCurve(() => 200);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(60, 100), stubContext);

		expect(capture.captured[0]?.velocity).toBe(127);
	});

	it("clamps velocity minimum to 1", () => {
		const unit = velocityCurve(() => -10);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(60, 100), stubContext);

		expect(capture.captured[0]?.velocity).toBe(1);
	});

	it("preserves note and timing", () => {
		const unit = velocityCurve((v) => v / 2);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(72, 80), stubContext);

		expect(capture.captured[0]?.note).toBe(72);
		expect(capture.captured[0]?.startMs).toBe(0);
		expect(capture.captured[0]?.stopMs).toBe(500);
	});
});
