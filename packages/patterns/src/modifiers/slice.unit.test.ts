import { slice } from "./slice";
import { sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("slice", () => {
	it("extracts note range", () => {
		const tree = sequence(N.C4(1), N.E4(1), N.G4(1));
		const result = slice(tree, 0, 2);
		result.setup(0);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});
});
