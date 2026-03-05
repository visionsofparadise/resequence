import { describe, expect, it } from "vitest";
import type { UnitContext } from "../context";
import type { NoteEvent } from "../note-event";
import { MidiUnit } from "../midi-unit";
import { humanize } from "./humanize";

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

function makeNoteEvent(note: number, velocity = 100, startMs = 1000): NoteEvent {
	return { note, bend: 0, velocity, frequency: 440, startMs, stopMs: startMs + 500, cleanupMs: startMs + 1000 };
}

describe("HumanizeMidiUnit", () => {
	it("passes notes through with no jitter when both options are 0", () => {
		const unit = humanize({ timing: 0, velocity: 0 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeNoteEvent(60), stubContext);

		expect(capture.captured).toHaveLength(1);
		expect(capture.captured[0]?.note).toBe(60);
		expect(capture.captured[0]?.velocity).toBe(100);
		expect(capture.captured[0]?.startMs).toBe(1000);
	});

	it("applies timing jitter within range", () => {
		const unit = humanize({ timing: 50 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);
		unit["_setup"](stubContext);

		for (let i = 0; i < 20; i++) {
			unit.schedule(makeNoteEvent(60, 100, 1000), stubContext);
		}

		for (const noteEvent of capture.captured) {
			expect(noteEvent.startMs).toBeGreaterThanOrEqual(950);
			expect(noteEvent.startMs).toBeLessThanOrEqual(1050);
		}
	});

	it("applies velocity jitter within range", () => {
		const unit = humanize({ velocity: 20 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);
		unit["_setup"](stubContext);

		for (let i = 0; i < 20; i++) {
			unit.schedule(makeNoteEvent(60, 100), stubContext);
		}

		for (const noteEvent of capture.captured) {
			expect(noteEvent.velocity).toBeGreaterThanOrEqual(80);
			expect(noteEvent.velocity).toBeLessThanOrEqual(120);
		}
	});

	it("clamps velocity to valid MIDI range", () => {
		const unit = humanize({ velocity: 50 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);
		unit["_setup"](stubContext);

		for (let i = 0; i < 20; i++) {
			unit.schedule(makeNoteEvent(60, 5), stubContext);
		}

		for (const noteEvent of capture.captured) {
			expect(noteEvent.velocity).toBeGreaterThanOrEqual(1);
			expect(noteEvent.velocity).toBeLessThanOrEqual(127);
		}
	});

	it("clamps startMs to non-negative", () => {
		const unit = humanize({ timing: 100 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);
		unit["_setup"](stubContext);

		for (let i = 0; i < 20; i++) {
			unit.schedule(makeNoteEvent(60, 100, 50), stubContext);
		}

		for (const noteEvent of capture.captured) {
			expect(noteEvent.startMs).toBeGreaterThanOrEqual(0);
		}
	});
});
