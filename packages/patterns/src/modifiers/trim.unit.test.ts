import { trim } from "./trim";
import { sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("trim", () => {
	it("clips notes to time window", () => {
		const tree = sequence(N.C4(2), N.E4(2));
		const result = trim(tree, 1, 3);
		const notes = collectNotes(result);
		// C4 spans 0-2, trimmed to 1-2 → starts at 0, ends at 1 in result
		// E4 spans 2-4, trimmed to 2-3 → starts at 1, ends at 2 in result
		expect(notes).toHaveLength(2);
		expect(result.endBeat).toBe(2);
	});
});
