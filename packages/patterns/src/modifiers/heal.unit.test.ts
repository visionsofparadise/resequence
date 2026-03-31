import { heal } from "./heal";
import { note, sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("heal", () => {
	it("merges adjacent same-pitch notes", () => {
		const tree = sequence(note(N.C4(1).pitch, 0.5), note(N.C4(1).pitch, 0.5));
		const result = heal(tree);
		result.setup(0);
		const notes = collectNotes(result);
		// Two adjacent C4 notes with no gap should merge into one
		expect(notes).toHaveLength(1);
	});
});
