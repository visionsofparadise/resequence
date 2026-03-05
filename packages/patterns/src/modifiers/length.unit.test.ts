import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { length } from "./length";

describe("length", () => {
	it("sets note duration", () => {
		const tree = sequence(N.C4(2));
		const result = length(tree, 0.5);
		const notes = collectNotes(result);
		expect(notes[0]!.note.endBeat - notes[0]!.note.startBeat).toBe(0.5);
	});
});
