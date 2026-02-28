import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { stretch } from "./stretch";

describe("StretchPattern", () => {
	it("doubles all timings with factor 2", () => {
		const pat = stretch(sequence(N.C4(1), N.E4(1)), 2);
		const notes = collectNotes(pat);
		expect(notes[0]).toMatchObject({ startBeat: 0, pitch: N.C4, endBeat: 2 });
		expect(notes[1]).toMatchObject({ startBeat: 1, pitch: N.E4, endBeat: 3 });
	});
});
