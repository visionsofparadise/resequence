import { describe, expect, it } from "vitest";
import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import { harmonize } from "./harmonize";

class CaptureMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "capture"] as const;
	readonly captured: Array<VoiceNote> = [];

	constructor() {
		super({ id: "capture" });
	}

	clone(): CaptureMidiUnit {
		return new CaptureMidiUnit();
	}

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

describe("HarmonizeMidiUnit", () => {
	it("passes the original note through", () => {
		const unit = harmonize([7]);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(60), stubContext);

		const notes = capture.captured.map((n) => n.note);
		expect(notes).toContain(60);
	});

	it("adds notes at specified intervals", () => {
		const unit = harmonize([7]);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeVoiceNote(60), stubContext);

		const notes = capture.captured.map((n) => n.note);
		expect(notes).toContain(67);
		expect(capture.captured).toHaveLength(2);
	});

});
