import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { slide } from "./slide";

describe("slide", () => {
	it("adds slide keyframes between overlapping consecutive notes", () => {
		const a = note(N.C4(1).pitch, 2);
		const b = note(N.E4(1).pitch, 1);
		const tree = sequence(a, b);
		// Notes: C4 at 0-2, E4 at 2-3. They don't overlap, so no slides.
		const result = slide(tree);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});

	it("returns unchanged pattern when fewer than 2 notes", () => {
		const tree = sequence(N.C4(1));
		const result = slide(tree);
		expect(result.notes).toBe(tree.notes);
	});
});
