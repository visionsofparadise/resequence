import { length } from "./length";
import { sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("length", () => {
	it("sets note duration", () => {
		const tree = sequence(N.C4(2));
		const result = length(tree, 0.5);
		result.setup(0);
		const notes = collectNotes(result);
		expect(notes[0]!.note.endBeat - notes[0]!.note.startBeat).toBe(0.5);
	});
});
