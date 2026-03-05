import { describe, expect, it } from "vitest";
import { pitchKey } from "../pitch";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { unison } from "./unison";

describe("unison", () => {
	it("produces correct number of voices", () => {
		const result = unison(N.C4(1), 3);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(3);
	});

	it("spreads pitch across voices", () => {
		const result = unison(N.C4(1), 3, { pitch: 2 });
		const notes = collectNotes(result);
		const keys = notes.map((n) => pitchKey(n.note.pitch)).sort((a, b) => a - b);
		expect(keys[0]).toBeLessThan(keys[1]!);
		expect(keys[1]).toBeLessThan(keys[2]!);
	});
});
