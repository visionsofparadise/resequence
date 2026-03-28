import { quantize } from "./quantize";
import { sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("quantize", () => {
	it("snaps notes to grid", () => {
		const tree = sequence(N.C4(0.6), N.E4(0.4));
		const result = quantize(tree, 1);
		const notes = collectNotes(result);
		const sorted = notes.sort((a, b) => a.absoluteBeat + a.note.startBeat - (b.absoluteBeat + b.note.startBeat));
		// First note at 0 snaps to 0, second at 0.6 snaps to 1
		expect(sorted[0]!.absoluteBeat + sorted[0]!.note.startBeat).toBe(0);
		expect(sorted[1]!.absoluteBeat + sorted[1]!.note.startBeat).toBe(1);
	});
});
