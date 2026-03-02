import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { mute } from "./mute";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("mute", () => {
	it("preserves duration but produces no notes", () => {
		const melody = sequence(N.C4(1), N.D4(1), N.E4(1));
		const muted = mute(melody);
		expect(muted.startBeat).toBe(0);
		expect(muted.endBeat).toBe(3);
		expect(collectNotes(muted)).toHaveLength(0);
	});

	it("stores original pattern as input", () => {
		const melody = sequence(N.C4(1));
		const muted = mute(melody);
		expect(muted.properties.input).toBe(melody);
	});

	it("preserves duration in a sequence", () => {
		const a = sequence(N.C4(1));
		const b = sequence(N.D4(1));
		const result = sequence(a, mute(sequence(N.E4(2))), b);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
		expect(notes[0]?.startBeat).toBe(0);
		expect(notes[1]?.startBeat).toBe(3);
	});
});
