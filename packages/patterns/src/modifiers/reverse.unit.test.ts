import { reverse } from "./reverse";
import { pitchKey, sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("reverse", () => {
	it("reverses note positions within duration", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		const result = reverse(tree);
		result.setup(0);
		const notes = collectNotes(result);
		// Sort by absolute position (offsetBeats + note.startBeat)
		const sorted = notes.sort((a, b) => a.absoluteBeat + a.note.startBeat - (b.absoluteBeat + b.note.startBeat));
		// E4 should now come first (at position 0) and C4 second (at position 1)
		expect(pitchKey(sorted[0]!.note.pitch)).toBe(pitchKey(N.E4(1).pitch));
		expect(pitchKey(sorted[1]!.note.pitch)).toBe(pitchKey(N.C4(1).pitch));
	});
});
