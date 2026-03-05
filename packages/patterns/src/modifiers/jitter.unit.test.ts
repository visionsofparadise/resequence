import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { jitter } from "./jitter";

describe("jitter", () => {
	it("produces deterministic output with seed", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		const result1 = jitter(tree, 10, 42);
		const result2 = jitter(tree, 10, 42);
		const notes1 = collectNotes(result1);
		const notes2 = collectNotes(result2);
		expect(notes1[0]!.note.startBeat).toBe(notes2[0]!.note.startBeat);
		expect(notes1[1]!.note.startBeat).toBe(notes2[1]!.note.startBeat);
	});
});
