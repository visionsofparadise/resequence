import { describe, expect, it } from "vitest";
import type { UnitContext } from "@resequence/web-au-core";
import type { NoteEvent, NoteSlide } from "@resequence/web-au-core";
import { MidiUnit } from "@resequence/web-au-core";
import { portamento } from "./portamento";

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

function makeNoteEvent(note: number, startMs: number, stopMs: number, slides?: ReadonlyArray<NoteSlide>): NoteEvent {
	return {
		note,
		bend: 0,
		velocity: 100,
		frequency: 440,
		startMs,
		stopMs,
		cleanupMs: stopMs + 500,
		slides,
	};
}

describe("PortamentoUnit", () => {
	it("first note has no slides", () => {
		const unit = portamento({ timeMs: 250 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		const noteEvent = makeNoteEvent(60, 0, 500);
		unit.schedule(noteEvent, stubContext);

		expect(capture.captured).toHaveLength(1);
		expect(capture.captured[0]!.slides).toBeUndefined();
	});

	it("second note gets portamento slides from previous pitch", () => {
		const unit = portamento({ timeMs: 250 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		unit.schedule(makeNoteEvent(60, 0, 500), stubContext);
		unit.schedule(makeNoteEvent(64, 500, 1000), stubContext);

		expect(capture.captured).toHaveLength(2);
		const secondNote = capture.captured[1]!;
		expect(secondNote.slides).toBeDefined();
		expect(secondNote.slides).toHaveLength(2);
		expect(secondNote.slides![0]!.timeMs).toBe(0);
		expect(secondNote.slides![0]!.cents).toBe(-400);
		expect(secondNote.slides![1]!.cents).toBe(0);
	});

	it("portamento time is clamped to note duration", () => {
		const unit = portamento({ timeMs: 500 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		unit.schedule(makeNoteEvent(60, 0, 500), stubContext);
		unit.schedule(makeNoteEvent(64, 500, 700), stubContext);

		const secondNote = capture.captured[1]!;
		expect(secondNote.slides).toBeDefined();
		expect(secondNote.slides![1]!.timeMs).toBe(200);
	});

	it("same pitch consecutive notes get no slides", () => {
		const unit = portamento({ timeMs: 250 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		unit.schedule(makeNoteEvent(60, 0, 500), stubContext);
		unit.schedule(makeNoteEvent(60, 500, 1000), stubContext);

		const secondNote = capture.captured[1]!;
		expect(secondNote.slides).toBeUndefined();
	});

	it("previous note with slides: portamento starts from slide endpoint", () => {
		const unit = portamento({ timeMs: 250 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = undefined;

		const slidingNote = makeNoteEvent(60, 0, 500, [
			{ timeMs: 0, cents: 0, curve: 0 },
			{ timeMs: 250, cents: 400, curve: 0 },
		]);
		unit.schedule(slidingNote, stubContext);
		unit.schedule(makeNoteEvent(67, 500, 1000), stubContext);

		const secondNote = capture.captured[1]!;
		expect(secondNote.slides).toBeDefined();
		expect(secondNote.slides![0]!.cents).toBe(-300);
	});

	it("state resets on setup", () => {
		const unit = portamento({ timeMs: 250 });
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit["lastPitch"] = { note: 60, bend: 0 };

		unit["_setup"](stubContext);

		unit.schedule(makeNoteEvent(64, 0, 500), stubContext);
		expect(capture.captured[0]!.slides).toBeUndefined();
	});
});
