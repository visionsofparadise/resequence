import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { flam } from "./flam";

describe("flam", () => {
	it("produces grace note + original", () => {
		const result = flam(N.C4(1), 0.1);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});
});
