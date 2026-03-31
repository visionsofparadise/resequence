import { slide } from "./slide";
import { note, sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("slide", () => {
	it("adds slide keyframes between overlapping consecutive notes", () => {
		const a = note(N.C4(1).pitch, 2);
		const b = note(N.E4(1).pitch, 1);
		const tree = sequence(a, b);
		// Notes: C4 at 0-2, E4 at 2-3. They don't overlap, so no slides.
		const result = slide(tree);
		result.setup(0);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});

	it("returns unchanged pattern when fewer than 2 notes", () => {
		const tree = sequence(N.C4(1));
		const result = slide(tree);
		result.setup(0);
		expect(result.notes).toHaveLength(tree.notes.length);
	});
});
