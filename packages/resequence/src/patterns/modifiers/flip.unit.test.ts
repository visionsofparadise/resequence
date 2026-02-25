import { describe, expect, it } from "vitest";
import { pitchToMidi, resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { FlipPattern, flip } from "./flip";

describe("FlipPattern", () => {
	describe("notes", () => {
		it("inverts pitch around center", () => {
			// C4=60, center=60: newPitch = 60 (unison)
			// E4=64, center=60: newPitch = 56 (Ab3)
			const pat = flip(sequence(note("C4", "4n"), note("E4", "4n")), "C4");
			expect(pat.notes[0]?.pitch).toEqual(resolvePitch("C4"));
			expect(pat.notes[1]?.pitch).toEqual(resolvePitch(56)); // Ab3
		});

		it("accepts numeric center", () => {
			const pat = flip(note("C4", "4n"), 60);
			expect(pat.notes[0]?.pitch).toEqual(resolvePitch("C4"));
		});

		it("octave-shifts to stay within range", () => {
			// E4=64, center=60 → flipped=56: within [C3,C5], stays at 56
			const pat = flip(note("E4", "4n"), "C4", ["C3", "C5"]);
			expect(pitchToMidi(pat.notes[0]!.pitch).note).toBeGreaterThanOrEqual(48);
			expect(pitchToMidi(pat.notes[0]!.pitch).note).toBeLessThanOrEqual(72);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(flip(note("C4", "2n"), "C4").durationBeats).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a FlipPattern", () => {
			expect(flip(note("C4", "4n"), "C4")).toBeInstanceOf(FlipPattern);
		});
	});
});
