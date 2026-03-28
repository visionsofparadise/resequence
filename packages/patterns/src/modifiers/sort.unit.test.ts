import { sort } from "./sort";
import { pitchKey, sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("sort", () => {
	it("sorts notes ascending by default", () => {
		const tree = sequence(N.G4(1), N.C4(1), N.E4(1));
		const result = sort(tree);
		const notes = collectNotes(result);
		const sorted = notes.sort((a, b) => (a.absoluteBeat + a.note.startBeat) - (b.absoluteBeat + b.note.startBeat));
		expect(pitchKey(sorted[0]!.note.pitch)).toBeLessThanOrEqual(pitchKey(sorted[1]!.note.pitch));
		expect(pitchKey(sorted[1]!.note.pitch)).toBeLessThanOrEqual(pitchKey(sorted[2]!.note.pitch));
	});
});
