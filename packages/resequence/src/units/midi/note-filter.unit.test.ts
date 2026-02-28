import { describe, expect, it } from "vitest";
import type { ScheduleContext } from "../../rendering/schedule-context";
import { MidiUnit } from "../midi-unit";
import type { VoiceNote } from "../midi-unit";
import { noteFilter } from "./note-filter";

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
	driverMap: new Map(),
	tempoMap: [],
	fromBeats: 0,
	toBeats: Infinity,
} as unknown as ScheduleContext;

function makeVoiceNote(note: number, velocity = 100): VoiceNote {
	return { note, bend: 0, velocity, startMs: 0, stopMs: 500, cleanupMs: 1000 };
}

describe("NoteFilterMidiUnit", () => {
	it("passes notes that match the predicate", () => {
		const unit = noteFilter((n) => n.velocity > 64);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(60, 100), stubContext);

		expect(capture.captured).toHaveLength(1);
		expect(capture.captured[0]?.velocity).toBe(100);
	});

	it("blocks notes that fail the predicate", () => {
		const unit = noteFilter((n) => n.velocity > 64);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(60, 30), stubContext);

		expect(capture.captured).toHaveLength(0);
	});
});
