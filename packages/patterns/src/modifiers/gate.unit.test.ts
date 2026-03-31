import { gate } from "./gate";
import { note, sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("gate", () => {
	it("clips notes to gate windows", () => {
		const tree = sequence(N.C4(4));
		const gateTree = sequence(note(N.C4(1).pitch, 1), note(N.C4(1).pitch, 1));
		const result = gate(tree, gateTree);
		result.setup(0);
		const notes = collectNotes(result);
		// Gate has windows at 0-1 and 1-2. Note C4 spans 0-4. Should produce 2 clips.
		expect(notes).toHaveLength(2);
	});
});
