import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { pitchKey } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { harmonize } from "./harmonize";

describe("harmonize", () => {
	it("doubles each note at the parallel interval", () => {
		const pat = harmonize(sequence(N.C4(1)), 7);
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(2);
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
		expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.G4));
	});
});
