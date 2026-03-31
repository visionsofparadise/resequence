import { repeat } from "./repeat";
import { N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("repeat", () => {
	it("multiplies notes", () => {
		const result = repeat(N.C4(1), 3);
		result.setup(0);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(3);
	});
});
