import { describe, expect, it } from "vitest";
import type { UnitContext } from "@resequence/web-au-core";
import { MidiUnit } from "@resequence/web-au-core";
import type { NoteEvent } from "@resequence/web-au-core";
import { noteFilter } from "./note-filter";

class CaptureMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "capture"] as const;
	readonly captured: Array<NoteEvent> = [];

	constructor() {
		super({ id: "capture" });
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

describe("NoteFilterMidiUnit", () => {
	it("passes notes that match the predicate", () => {
		const unit = noteFilter((n) => n.velocity > 64);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeNoteEvent(60, 100), stubContext);

		expect(capture.captured).toHaveLength(1);
		expect(capture.captured[0]?.velocity).toBe(100);
	});

	it("blocks notes that fail the predicate", () => {
		const unit = noteFilter((n) => n.velocity > 64);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeNoteEvent(60, 30), stubContext);

		expect(capture.captured).toHaveLength(0);
	});
});
