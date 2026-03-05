import { describe, expect, it } from "vitest";
import { pitchKey } from "../pitch";
import { layer } from "../patterns/layer";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { voicing } from "./voicing";

describe("voicing", () => {
	it("rearranges chord to close voicing", () => {
		const chord = layer(N.C4(1), N.E5(1), N.G5(1));
		const result = voicing(chord, "close");
		const notes = collectNotes(result);
		const keys = notes.map((n) => pitchKey(n.note.pitch)).sort((a, b) => a - b);
		// Close voicing should bring all notes within an octave of the bass
		const range = keys[keys.length - 1]! - keys[0]!;
		expect(range).toBeLessThanOrEqual(12);
	});
});
