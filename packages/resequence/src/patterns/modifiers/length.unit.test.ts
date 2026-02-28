import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { length } from "./length";

describe("length", () => {
	it("sets all note durations to the given value", () => {
		const pat = length(sequence(N.C4(1), N.E4(1)), 120);
		expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 120 });
		expect(collectNotes(pat)[1]).toMatchObject({ startBeat: 1, endBeat: 121 });
	});
});
