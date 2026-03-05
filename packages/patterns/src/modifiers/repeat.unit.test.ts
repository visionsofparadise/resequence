import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { repeat } from "./repeat";

describe("repeat", () => {
	it("multiplies notes", () => {
		const result = repeat(N.C4(1), 3);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(3);
	});
});
