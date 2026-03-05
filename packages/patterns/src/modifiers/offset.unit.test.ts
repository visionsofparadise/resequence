import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { offset } from "./offset";

describe("offset", () => {
	it("shifts note positions", () => {
		const result = offset(N.C4(1), 2);
		const notes = collectNotes(result);
		expect(notes[0]!.note.startBeat).toBe(2);
		expect(notes[0]!.note.endBeat).toBe(3);
	});
});
