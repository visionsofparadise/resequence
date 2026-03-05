import { describe, expect, it } from "vitest";
import { pitchKey } from "../pitch";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { transpose } from "./transpose";
import { unwrap } from "./unwrap";

describe("unwrap", () => {
	it("extracts original from modifier", () => {
		const original = sequence(N.C4(1));
		const transposed = transpose(original, 7);
		const unwrapped = unwrap(transposed);
		const notes = collectNotes(unwrapped);
		// Should be original untransposed note
		expect(pitchKey(notes[0]!.note.pitch)).toBe(pitchKey(N.C4(1).pitch));
	});
});
