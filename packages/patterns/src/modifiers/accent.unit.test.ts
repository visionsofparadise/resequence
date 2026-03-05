import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { accent } from "./accent";

describe("accent", () => {
	it("increases velocity at accent positions", () => {
		const tree = sequence(N.C4(1), N.E4(1), N.G4(1), N.C5(1));
		const result = accent(tree, [2], 20);
		const notes = collectNotes(result);
		// Accent at beats 0, 2 (cycle of 2)
		expect(notes[0]!.note.velocity).toBe(120); // 100 + 20
	});
});
