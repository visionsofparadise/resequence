import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { pitchKey } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { unison } from "./unison";

describe("UnisonPattern", () => {
	it("creates the specified number of voice copies", () => {
		const pat = unison(sequence(N.C4(1)), 3);
		expect(collectNotes(pat)).toHaveLength(3);
	});

	it("centers voices around original pitch with pitch spread", () => {
		const pat = unison(sequence(N.C4(1)), 3, { pitch: 12 });
		const notes = collectNotes(pat);
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C3));
		expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.C4));
		expect(pitchKey(notes[2]!.pitch)).toBe(pitchKey(N.C5));
	});

	it("applies CC spread symmetrically across voices", () => {
		const pat = unison(sequence(N.C4(1)), 3, { cc: { 1: 10 } });
		const notes = collectNotes(pat);
		expect(notes[0]!.cc?.[1]).toBe(54);
		expect(notes[1]!.cc?.[1]).toBe(64);
		expect(notes[2]!.cc?.[1]).toBe(74);
	});
});
