import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { splice } from "./splice";

describe("splice", () => {
	it("removes notes at index", () => {
		const tree = sequence(N.C4(1), N.E4(1), N.G4(1));
		const result = splice(tree, { at: 1, remove: 1 });
		const notes = collectNotes(result);
		expect(notes).toHaveLength(2);
	});
});
