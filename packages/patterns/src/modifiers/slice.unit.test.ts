import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { slice } from "./slice";

describe("slice", () => {
	it("extracts note range", () => {
		const tree = sequence(N.C4(1), N.E4(1), N.G4(1));
		const result = slice(tree, 0, 2);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});
});
