import { invert } from "./invert";
import { pitchKey, layer, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("invert", () => {
	it("shifts lowest notes up an octave", () => {
		const chord = layer(N.C4(1), N.E4(1), N.G4(1));
		const result = invert(chord, 1);
		result.setup(0);
		const notes = collectNotes(result);
		const keys = notes.map((n) => pitchKey(n.note.pitch)).sort((a, b) => a - b);
		// C4 shifted up an octave to C5, E4 and G4 stay
		expect(keys[0]).toBe(pitchKey(N.E4(1).pitch));
		expect(keys[2]).toBe(pitchKey(N.C4(1).pitch) + 12);
	});
});
