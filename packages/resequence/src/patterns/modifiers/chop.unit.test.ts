import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { chop } from "./chop";

describe("chop", () => {
	it("subdivides a quarter note into four 16th notes", () => {
		const pat = chop(sequence(N.C4(1)), 0.25);
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(4);
		expect(notes[0]).toMatchObject({ startBeat: 0, pitch: N.C4, endBeat: 0.25 });
		expect(notes[1]).toMatchObject({ startBeat: 0.25, endBeat: 0.5 });
		expect(notes[2]).toMatchObject({ startBeat: 0.5, endBeat: 0.75 });
		expect(notes[3]).toMatchObject({ startBeat: 0.75, endBeat: 1 });
	});

	it("returns empty when subdivision > note duration", () => {
		const pat = chop(sequence(N.C4(0.5)), 1);
		expect(collectNotes(pat)).toHaveLength(0);
	});
});
