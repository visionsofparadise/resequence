import { describe, expect, it } from "vitest";
import type { UnitContext } from "@resequence/web-au-core";
import type { NoteEvent } from "@resequence/web-au-core";
import { MidiUnit } from "@resequence/web-au-core";
import { harmonize } from "./harmonize";

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

describe("HarmonizeMidiUnit", () => {
	it("passes the original note through", () => {
		const unit = harmonize([7]);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeNoteEvent(60), stubContext);

		const notes = capture.captured.map((n) => n.note);
		expect(notes).toContain(60);
	});

	it("adds notes at specified intervals", () => {
		const unit = harmonize([7]);
		const capture = new CaptureMidiUnit();
		unit.to(capture);

		unit.schedule(makeNoteEvent(60), stubContext);

		const notes = capture.captured.map((n) => n.note);
		expect(notes).toContain(67);
		expect(capture.captured).toHaveLength(2);
	});
});
