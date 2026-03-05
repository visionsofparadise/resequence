import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { legato } from "./legato";

describe("legato", () => {
	it("extends notes to fill gaps", () => {
		const tree = sequence(note(N.C4(1).pitch, 0.5), note(N.E4(1).pitch, 0.5));
		const result = legato(tree);
		const notes = collectNotes(result);
		const sorted = notes.sort((a, b) => (a.absoluteBeat + a.note.startBeat) - (b.absoluteBeat + b.note.startBeat));
		// First note should extend to meet second note at beat 0.5
		expect(sorted[0]!.note.endBeat).toBe(0.5);
	});
});
