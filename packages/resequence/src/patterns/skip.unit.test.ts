import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { skip } from "./modifiers/skip";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("skip", () => {
	it("produces zero duration and no notes", () => {
		const melody = sequence(N.C4(2));
		const skipped = skip(melody);
		expect(skipped.startBeat).toBe(0);
		expect(skipped.endBeat).toBe(0);
		expect(collectNotes(skipped)).toHaveLength(0);
	});

	it("stores original pattern as input", () => {
		const melody = sequence(N.C4(1));
		const skipped = skip(melody);
		expect(skipped.properties.input).toBe(melody);
	});

	it("c follows immediately after a when b is skipped", () => {
		const a = sequence(N.C4(1));
		const b = sequence(N.D4(2));
		const c = sequence(N.E4(1));
		const result = sequence(a, skip(b), c);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
		expect(notes[0]?.startBeat).toBe(0);
		expect(notes[1]?.startBeat).toBe(1);
	});
});
