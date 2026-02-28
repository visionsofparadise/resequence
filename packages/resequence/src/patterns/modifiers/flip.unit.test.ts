import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { pitchKey, pitchToMidi } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { flip } from "./flip";

describe("flip", () => {
	it("inverts pitch around center", () => {
		const pat = flip(sequence(N.C4(1), N.E4(1)), N.C4);
		const notes = collectNotes(pat);
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
		expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.Gs3));
	});

	it("octave-shifts to stay within range", () => {
		const pat = flip(N.E4(1), N.C4, [N.C3, N.C5]);
		expect(pitchToMidi(collectNotes(pat)[0]!.pitch).note).toBeGreaterThanOrEqual(48);
		expect(pitchToMidi(collectNotes(pat)[0]!.pitch).note).toBeLessThanOrEqual(72);
	});
});
