import { voicing } from "./voicing";
import { pitchKey, layer, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("voicing", () => {
	it("rearranges chord to close voicing", () => {
		const chord = layer(N.C4(1), N.E5(1), N.G5(1));
		const result = voicing(chord, "close");
		result.setup(0);
		const notes = collectNotes(result);
		const keys = notes.map((n) => pitchKey(n.note.pitch)).sort((a, b) => a - b);
		// Close voicing should bring all notes within an octave of the bass
		const range = keys[keys.length - 1]! - keys[0]!;
		expect(range).toBeLessThanOrEqual(12);
	});
});
