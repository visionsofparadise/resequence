import { transpose } from "./transpose";
import { pitchKey, sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("transpose", () => {
	it("shifts pitch by interval", () => {
		const result = transpose(N.C4(1), 7);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(1);
		expect(pitchKey(notes[0]!.note.pitch)).toBe(pitchKey(N.G4(1).pitch));
	});

	it("stores input for unwrap", () => {
		const original = sequence(N.C4(1));
		const result = transpose(original, 7);
		expect(result.properties.input).toBe(original);
		expect(result.properties.interval).toBe(7);
	});
});
