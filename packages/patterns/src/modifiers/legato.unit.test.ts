import { legato } from "./legato";
import { note, sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("legato", () => {
	it("extends notes to fill gaps", () => {
		const tree = sequence(note(N.C4(1).pitch, 0.5), note(N.E4(1).pitch, 0.5));
		const result = legato(tree);
		result.setup(0);
		const notes = collectNotes(result);
		const sorted = notes.sort((a, b) => a.absoluteBeat + a.note.startBeat - (b.absoluteBeat + b.note.startBeat));
		// First note should extend to meet second note at beat 0.5
		expect(sorted[0]!.note.endBeat).toBe(0.5);
	});
});
