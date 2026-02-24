import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { ReversePattern, reverse } from "./reverse";

describe("ReversePattern", () => {
	describe("notes", () => {
		it("reverses note order in time", () => {
			const pat = reverse(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")));
			// Original: C4@0, E4@480, G4@960, total=1440
			// Reversed: G4@0, E4@480, C4@960 (mirrored)
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 67 },
				{ tick: 480, pitch: 64 },
				{ tick: 960, pitch: 60 },
			]);
		});

		it("returns empty for empty child", () => {
			expect(reverse(sequence()).notes).toEqual([]);
		});

		it("single note tick becomes 0", () => {
			const pat = reverse(note("C4", "4n"));
			expect(pat.notes[0]?.tick).toBe(0);
		});
	});

	describe("durationTicks", () => {
		it("preserves total duration", () => {
			const pat = reverse(sequence(note("C4", "4n"), note("E4", "4n")));
			expect(pat.durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is a ReversePattern", () => {
			expect(reverse(note("C4", "4n"))).toBeInstanceOf(ReversePattern);
		});
	});
});
