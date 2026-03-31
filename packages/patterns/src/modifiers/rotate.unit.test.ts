import { rotate } from "./rotate";
import { pitchKey, sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("rotate", () => {
	it("circularly shifts note order", () => {
		const tree = sequence(N.C4(1), N.E4(1), N.G4(1));
		const result = rotate(tree, 1);
		result.setup(0);
		const notes = collectNotes(result);
		// Sort by absolute position
		const sorted = notes.sort((a, b) => (a.absoluteBeat + a.note.startBeat) - (b.absoluteBeat + b.note.startBeat));
		// After rotating by 1: E4, G4, C4
		expect(pitchKey(sorted[0]!.note.pitch)).toBe(pitchKey(N.E4(1).pitch));
		expect(pitchKey(sorted[2]!.note.pitch)).toBe(pitchKey(N.C4(1).pitch));
	});
});
