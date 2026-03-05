import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { gate } from "./gate";

describe("gate", () => {
	it("clips notes to gate windows", () => {
		const tree = sequence(N.C4(4));
		const gateTree = sequence(note(N.C4(1).pitch, 1), note(N.C4(1).pitch, 1));
		const result = gate(tree, gateTree);
		const notes = collectNotes(result);
		// Gate has windows at 0-1 and 1-2. Note C4 spans 0-4. Should produce 2 clips.
		expect(notes).toHaveLength(2);
	});
});
