import { splice } from "./splice";
import { sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("splice", () => {
	it("removes notes at index", () => {
		const tree = sequence(N.C4(1), N.E4(1), N.G4(1));
		const result = splice(tree, { at: 1, remove: 1 });
		result.setup(0);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});
});
