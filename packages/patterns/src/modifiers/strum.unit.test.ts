import { strum } from "./strum";
import { layer, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("strum", () => {
	it("spreads chord notes over time", () => {
		const chord = layer(N.C4(1), N.E4(1), N.G4(1));
		const result = strum(chord, { strumOffset: 0.1 });
		const notes = collectNotes(result);
		const starts = notes.map((n) => n.absoluteBeat + n.note.startBeat).sort((a, b) => a - b);
		// Notes should be staggered
		expect(starts[1]! - starts[0]!).toBeCloseTo(0.1);
		expect(starts[2]! - starts[1]!).toBeCloseTo(0.1);
	});
});
