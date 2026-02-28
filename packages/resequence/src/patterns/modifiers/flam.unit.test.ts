import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { collectNotes } from "../utils/tree";
import { flam } from "./flam";

describe("flam", () => {
	it("adds a grace note for each input note", () => {
		const pat = flam(N.C4(1), 60);
		expect(collectNotes(pat)).toHaveLength(2);
	});

	it("places grace note before main note even when it goes negative", () => {
		const pat = flam(N.C4(1), 60);
		expect(collectNotes(pat)[0]!.startBeat).toBe(-60);
	});
});
