import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { heal } from "./heal";

describe("heal", () => {
	it("merges adjacent same-pitch notes", () => {
		const tree = sequence(note(N.C4(1).pitch, 0.5), note(N.C4(1).pitch, 0.5));
		const result = heal(tree);
		const notes = collectNotes(result);
		// Two adjacent C4 notes with no gap should merge into one
		expect(notes).toHaveLength(1);
	});
});
