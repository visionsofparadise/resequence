import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { ReversePattern, reverse } from "./reverse";

describe("ReversePattern", () => {
	describe("notes", () => {
		it("reverses note order in time", () => {
			const pat = reverse(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")));
			// Original: C4@0, E4@1, G4@2, total=3
			// Reversed: G4@0, E4@1, C4@2 (mirrored)
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("G4") },
				{ beat: 1, pitch: resolvePitch("E4") },
				{ beat: 2, pitch: resolvePitch("C4") },
			]);
		});

		it("returns empty for empty child", () => {
			expect(reverse(sequence()).notes).toEqual([]);
		});

		it("single note tick becomes 0", () => {
			const pat = reverse(note("C4", "4n"));
			expect(pat.notes[0]?.beat).toBe(0);
		});
	});

	describe("durationBeats", () => {
		it("preserves total duration", () => {
			const pat = reverse(sequence(note("C4", "4n"), note("E4", "4n")));
			expect(pat.durationBeats).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a ReversePattern", () => {
			expect(reverse(note("C4", "4n"))).toBeInstanceOf(ReversePattern);
		});
	});
});
