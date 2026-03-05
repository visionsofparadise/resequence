import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { chop } from "./chop";

describe("chop", () => {
	it("subdivides notes", () => {
		const result = chop(N.C4(2), 0.5);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(4);
	});
});
