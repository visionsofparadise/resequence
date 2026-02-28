import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { jitter } from "./jitter";

describe("jitter", () => {
	it("produces same output every run with a seed", () => {
		const src = sequence(N.C4(1), N.E4(1), N.G4(1));
		const pat1 = jitter(src, 60, 42);
		const pat2 = jitter(src, 60, 42);
		expect(collectNotes(pat1).map((positionedNote) => positionedNote.startBeat)).toEqual(
			collectNotes(pat2).map((positionedNote) => positionedNote.startBeat),
		);
	});
});
