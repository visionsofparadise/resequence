import { describe, expect, it } from "vitest";
import type { UnitContext } from "../context";
import { MidiUnit } from "../midi-unit";
import type { NoteEvent } from "../note-event";
import { velocityCurve } from "./velocity-curve";

class CaptureMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "capture"] as const;
	readonly captured: Array<NoteEvent> = [];

	constructor() {
		super({ id: "capture" });
	}

	clone(): CaptureMidiUnit {
		return new CaptureMidiUnit();
	}

	protected override _schedule(noteEvent: NoteEvent): void {
		this.captured.push(noteEvent);
	}
}

const stubContext = {
	audioContext: {} as BaseAudioContext,
	driverMap: new Map(),
	getSample: async () => { throw new Error("not implemented"); },
	loadModule: async () => {},
} as unknown as UnitContext;

function makeNoteEvent(note: number, velocity = 100): NoteEvent {
	return { note, bend: 0, velocity, frequency: 440, startMs: 0, stopMs: 500, cleanupMs: 1000 };
}

describe("VelocityCurveMidiUnit", () => {
	it("applies an exponential velocity curve", () => {
		const unit = velocityCurve((v) => (v * v) / 127);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeNoteEvent(60, 100), stubContext);

		expect(capture.captured[0]?.velocity).toBe(Math.round((100 * 100) / 127));
	});

	it("clamps velocity to valid MIDI range", () => {
		const unit = velocityCurve(() => 200);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeNoteEvent(60, 100), stubContext);

		expect(capture.captured[0]?.velocity).toBe(127);
	});

	it("clamps velocity minimum to 1", () => {
		const unit = velocityCurve(() => -10);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeNoteEvent(60, 100), stubContext);

		expect(capture.captured[0]?.velocity).toBe(1);
	});
});
