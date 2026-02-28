import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { ReversePattern, reverse } from "./reverse";

describe("ReversePattern", () => {
	describe("notes", () => {
		it("reverses note order in time", () => {
			const pat = reverse(sequence(N.C4(1), N.E4(1), N.G4(1)));
			// Original: C4@0, E4@1, G4@2, total=3
			// Reversed: G4@0, E4@1, C4@2 (mirrored)
			const notes = collectNotes(pat).slice().sort((a, b) => a.startBeat - b.startBeat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: N.G4 },
				{ startBeat: 1, pitch: N.E4 },
				{ startBeat: 2, pitch: N.C4 },
			]);
		});

		it("returns empty for empty child", () => {
			expect(collectNotes(reverse(sequence()))).toEqual([]);
		});

		it("single note tick becomes 0", () => {
			const pat = reverse(sequence(N.C4(1)));
			expect(collectNotes(pat)[0]?.startBeat).toBe(0);
		});
	});

	describe("durationBeats", () => {
		it("preserves total duration", () => {
			const pat = reverse(sequence(N.C4(1), N.E4(1)));
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a ReversePattern", () => {
			expect(reverse(sequence(N.C4(1)))).toBeInstanceOf(ReversePattern);
		});
	});
});
