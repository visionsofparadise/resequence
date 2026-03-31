import { flip } from "./flip";
import { pitchKey, layer, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("flip", () => {
	it("inverts pitch around center", () => {
		const c4 = N.C4(1);
		const e4 = N.E4(1);
		const center = N.C4(1).pitch;
		const result = flip(layer(c4, e4), center);
		result.setup(0);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
		// C4 stays at C4 (center), E4 (4 steps above) becomes Ab3 (4 steps below)
		const keys = notes.map((n) => pitchKey(n.note.pitch)).sort((a, b) => a - b);
		expect(keys[0]).toBeLessThan(pitchKey(center));
	});
});
