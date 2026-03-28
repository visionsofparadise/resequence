import { flam } from "./flam";
import { N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("flam", () => {
	it("produces grace note + original", () => {
		const result = flam(N.C4(1), 0.1);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});
});
