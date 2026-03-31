import { stretch } from "./stretch";
import { sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("stretch", () => {
	it("scales note durations", () => {
		const result = stretch(sequence(N.C4(1), N.E4(1)), 2);
		result.setup(0);
		const notes = collectNotes(result);
		// Note durations scaled from 1 to 2
		expect(notes[0]!.note.endBeat - notes[0]!.note.startBeat).toBe(2);
		expect(notes[1]!.note.endBeat - notes[1]!.note.startBeat).toBe(2);
	});
});
