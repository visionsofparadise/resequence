import { distribute } from "./distribute";
import { N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("distribute", () => {
	it("distributes hits as evenly as possible across steps", () => {
		const pat = distribute(3, 8, N.C4(1).pitch, 0.5);
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(3);
		const sorted = notes.sort((a, b) => (a.absoluteBeat + a.note.startBeat) - (b.absoluteBeat + b.note.startBeat));
		expect(sorted[0]!.absoluteBeat).toBe(0); // step 0
		expect(sorted[1]!.absoluteBeat).toBe(1.5); // step 3 x 0.5
		expect(sorted[2]!.absoluteBeat).toBe(3); // step 6 x 0.5
	});

	it("produces all hits when hits equals steps", () => {
		const pat = distribute(4, 4, N.C4(1).pitch, 0.5);
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(4);
	});

	it("produces no notes when hits is zero", () => {
		const pat = distribute(0, 8, N.C4(1).pitch, 0.5);
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(0);
	});

	it("rotates the pattern by the specified steps", () => {
		const pat = distribute(3, 8, N.C4(1).pitch, 0.5, 1);
		const notes = collectNotes(pat);
		const sorted = notes.sort((a, b) => (a.absoluteBeat + a.note.startBeat) - (b.absoluteBeat + b.note.startBeat));
		expect(sorted[0]!.absoluteBeat).toBe(1); // step 2 x 0.5
		expect(sorted[1]!.absoluteBeat).toBe(2.5); // step 5 x 0.5
		expect(sorted[2]!.absoluteBeat).toBe(3.5); // step 7 x 0.5
	});
});
