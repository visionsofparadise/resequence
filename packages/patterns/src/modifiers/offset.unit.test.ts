import { offset } from "./offset";
import { N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("offset", () => {
	it("shifts note positions", () => {
		const result = offset(N.C4(1), 2);
		const notes = collectNotes(result);
		expect(notes[0]!.note.startBeat).toBe(2);
		expect(notes[0]!.note.endBeat).toBe(3);
	});
});
