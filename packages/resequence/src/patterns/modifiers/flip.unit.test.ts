import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { FlipPattern, flip } from "./flip";

describe("FlipPattern", () => {
	describe("notes", () => {
		it("inverts pitch around center", () => {
			// C4=60, center=60: newPitch = 120-60 = 60 (unison)
			// E4=64, center=60: newPitch = 120-64 = 56 (Ab3)
			const pat = flip(sequence(note("C4", "4n"), note("E4", "4n")), "C4");
			expect(pat.notes[0]?.pitch).toBe(60);
			expect(pat.notes[1]?.pitch).toBe(56);
		});

		it("accepts numeric center", () => {
			const pat = flip(note("C4", "4n"), 60);
			expect(pat.notes[0]?.pitch).toBe(60);
		});

		it("octave-shifts to stay within range", () => {
			// C4=60, center=60 → flipped=60, range=[48,72]: stays at 60
			// E4=64, center=60 → flipped=56: within [48,72], stays at 56
			const pat = flip(note("E4", "4n"), "C4", ["C3", "C5"]);
			expect(pat.notes[0]?.pitch).toBeGreaterThanOrEqual(48);
			expect(pat.notes[0]?.pitch).toBeLessThanOrEqual(72);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(flip(note("C4", "2n"), "C4").durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is a FlipPattern", () => {
			expect(flip(note("C4", "4n"), "C4")).toBeInstanceOf(FlipPattern);
		});
	});
});
