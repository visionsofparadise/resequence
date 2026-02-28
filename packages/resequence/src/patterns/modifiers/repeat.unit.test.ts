import { describe, expect, it } from "vitest";
import { ResequenceError } from "../../error";
import { N } from "../../tunings/chromatic";
import { collectNotes } from "../utils/tree";
import { repeat } from "./repeat";

describe("RepeatPattern", () => {
	it("rejects count less than 1", () => {
		expect(() => repeat(N.C4(1), 0)).toThrow(ResequenceError);
	});

	it("rejects non-integer count", () => {
		expect(() => repeat(N.C4(1), 2.5)).toThrow(ResequenceError);
	});

	it("multiplies child duration by count", () => {
		expect(repeat(N.C4(1), 4).endBeat - repeat(N.C4(1), 4).startBeat).toBe(4);
	});

	it("places repeated notes at correct offsets", () => {
		const pat = repeat(N.C4(1), 4);
		expect(collectNotes(pat)).toMatchObject([
			{ startBeat: 0, pitch: N.C4 },
			{ startBeat: 1, pitch: N.C4 },
			{ startBeat: 2, pitch: N.C4 },
			{ startBeat: 3, pitch: N.C4 },
		]);
	});
});
