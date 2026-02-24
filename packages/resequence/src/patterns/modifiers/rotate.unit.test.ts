import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { RotatePattern, rotate } from "./rotate";

describe("RotatePattern", () => {
	describe("notes", () => {
		it("rotates note sequence by 1 step", () => {
			// C4@0, E4@480, G4@960 → E4@0, G4@480, C4@960
			const pat = rotate(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 1);
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 64 },
				{ tick: 480, pitch: 67 },
				{ tick: 960, pitch: 60 },
			]);
		});

		it("rotating by note count returns original order", () => {
			const src = sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat = rotate(src, 3);
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 60 },
				{ tick: 480, pitch: 64 },
				{ tick: 960, pitch: 67 },
			]);
		});

		it("negative rotation wraps backwards", () => {
			// Rotate by -1 is same as rotate by (n-1)
			const forward = rotate(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 2);
			const backward = rotate(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), -1);
			expect(forward.notes.map((positionedNote) => positionedNote.pitch)).toEqual(
				backward.notes.map((positionedNote) => positionedNote.pitch),
			);
		});

		it("preserves total duration", () => {
			const pat = rotate(sequence(note("C4", "4n"), note("E4", "4n")), 1);
			expect(pat.durationTicks).toBe(960);
		});

		it("returns empty for empty child", () => {
			expect(rotate(sequence(), 1).notes).toEqual([]);
		});
	});

	describe("instanceof", () => {
		it("is a RotatePattern", () => {
			expect(rotate(note("C4", "4n"), 0)).toBeInstanceOf(RotatePattern);
		});
	});
});
