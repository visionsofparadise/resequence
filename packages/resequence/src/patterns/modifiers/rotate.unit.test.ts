import { describe, expect, it } from "vitest";
import { pitchKey, resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { RotatePattern, rotate } from "./rotate";

describe("RotatePattern", () => {
	describe("notes", () => {
		it("rotates note sequence by 1 step", () => {
			// C4@0, E4@1, G4@2 → E4@0, G4@1, C4@2
			const pat = rotate(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 1);
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("E4") },
				{ beat: 1, pitch: resolvePitch("G4") },
				{ beat: 2, pitch: resolvePitch("C4") },
			]);
		});

		it("rotating by note count returns original order", () => {
			const src = sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat = rotate(src, 3);
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4") },
				{ beat: 1, pitch: resolvePitch("E4") },
				{ beat: 2, pitch: resolvePitch("G4") },
			]);
		});

		it("negative rotation wraps backwards", () => {
			// Rotate by -1 is same as rotate by (n-1)
			const forward = rotate(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 2);
			const backward = rotate(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), -1);
			expect(forward.notes.map((positionedNote) => pitchKey(positionedNote.pitch))).toEqual(
				backward.notes.map((positionedNote) => pitchKey(positionedNote.pitch)),
			);
		});

		it("preserves total duration", () => {
			const pat = rotate(sequence(note("C4", "4n"), note("E4", "4n")), 1);
			expect(pat.durationBeats).toBe(2);
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
