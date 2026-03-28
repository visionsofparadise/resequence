import { chop } from "./chop";
import { N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("chop", () => {
	it("subdivides notes", () => {
		const result = chop(N.C4(2), 0.5);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(4);
	});
});
