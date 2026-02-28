import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { pitchKey, pitchToMidi } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { FlipPattern, flip } from "./flip";

describe("FlipPattern", () => {
	describe("notes", () => {
		it("inverts pitch around center", () => {
			// C4=60, center=60: newPitch = 60 (unison)
			// E4=64, center=60: newPitch = 56 (Ab3)
			const pat = flip(sequence(N.C4(1), N.E4(1)), N.C4);
			const notes = collectNotes(pat);
			expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
			expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.Gs3)); // Ab3
		});
		it("reflects at center (identity case)", () => {
			const pat = flip(sequence(N.C4(1)), N.C4);
			expect(pitchKey(collectNotes(pat)[0]!.pitch)).toBe(pitchKey(N.C4));
		});
		it("octave-shifts to stay within range", () => {
			// E4=64, center=60 → flipped=56: within [C3,C5], stays at 56
			const pat = flip(sequence(N.E4(1)), N.C4, [N.C3, N.C5]);
			expect(pitchToMidi(collectNotes(pat)[0]!.pitch).note).toBeGreaterThanOrEqual(48);
			expect(pitchToMidi(collectNotes(pat)[0]!.pitch).note).toBeLessThanOrEqual(72);
		});
	});
	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = flip(sequence(N.C4(2)), N.C4);
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});
	});
	describe("instanceof", () => {
		it("is a FlipPattern", () => {
			expect(flip(sequence(N.C4(1)), N.C4)).toBeInstanceOf(FlipPattern);
		});
	});
});
