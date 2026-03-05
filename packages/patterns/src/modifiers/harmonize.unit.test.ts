import { describe, expect, it } from "vitest";
import { pitchKey } from "../pitch";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { harmonize } from "./harmonize";

describe("harmonize", () => {
	it("produces original + transposed copy", () => {
		const result = harmonize(N.C4(1), 7);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
		const keys = notes.map((n) => pitchKey(n.note.pitch)).sort((a, b) => a - b);
		expect(keys[0]).toBe(pitchKey(N.C4(1).pitch));
		expect(keys[1]).toBe(pitchKey(N.G4(1).pitch));
	});
});
