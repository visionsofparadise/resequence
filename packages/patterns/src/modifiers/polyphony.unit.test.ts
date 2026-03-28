import { polyphony } from "./polyphony";
import { layer, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("polyphony", () => {
	it("limits simultaneous notes", () => {
		const chord = layer(N.C4(4), N.E4(4), N.G4(4));
		const result = polyphony(chord, 2);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});
});
