import { describe, expect, it } from "vitest";
import { layer } from "../layer";
import { note } from "../note";
import { StrumPattern, strum } from "./strum";

// C major chord: C4=60, E4=64, G4=67
function cMajChord(): ReturnType<typeof layer> {
	return layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
}

describe("StrumPattern", () => {
	describe("notes", () => {
		it("staggers notes from lowest to highest (up direction)", () => {
			const pat = strum(cMajChord());
			const sorted = pat.notes.slice().sort((noteA, noteB) => noteA.pitch - noteB.pitch);
			expect(sorted[0]?.tick).toBe(0);
			expect(sorted[1]?.tick).toBe(15);
			expect(sorted[2]?.tick).toBe(30);
		});

		it("staggers notes from highest to lowest (down direction)", () => {
			const pat = strum(cMajChord(), { direction: "down" });
			const pitchOrder = pat.notes.map((positionedNote) => positionedNote.pitch);
			// G4 (67) is staggered first (tick 0), then E4 (64), then C4 (60)
			const g4 = pat.notes.find((positionedNote) => positionedNote.pitch === 67)!;
			const c4 = pat.notes.find((positionedNote) => positionedNote.pitch === 60)!;
			expect(g4.tick).toBeLessThan(c4.tick);
			expect(pitchOrder).toBeDefined();
		});

		it("uses custom strumOffset", () => {
			const pat = strum(cMajChord(), { strumOffset: 10 });
			const sorted = pat.notes.slice().sort((noteA, noteB) => noteA.pitch - noteB.pitch);
			expect(sorted[1]?.tick).toBe(10);
			expect(sorted[2]?.tick).toBe(20);
		});

		it("returns empty for empty child", () => {
			expect(strum(layer()).notes).toEqual([]);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(strum(cMajChord()).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is a StrumPattern", () => {
			expect(strum(cMajChord())).toBeInstanceOf(StrumPattern);
		});
	});
});
