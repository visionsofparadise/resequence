import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchKey } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { RotatePattern, rotate } from "./rotate";

describe("RotatePattern", () => {
	describe("notes", () => {
		it("rotates note sequence by 1 step", () => {
			// C4@0, E4@1, G4@2 → E4@0, G4@1, C4@2
			const pat = rotate(sequence(N.C4(1), N.E4(1), N.G4(1)), 1);
			const notes = collectNotes(pat).slice().sort((a, b) => a.startBeat - b.startBeat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: N.E4 },
				{ startBeat: 1, pitch: N.G4 },
				{ startBeat: 2, pitch: N.C4 },
			]);
		});

		it("rotating by note count returns original order", () => {
			const src = sequence(N.C4(1), N.E4(1), N.G4(1));
			const pat = rotate(src, 3);
			const notes = collectNotes(pat).slice().sort((a, b) => a.startBeat - b.startBeat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: N.C4 },
				{ startBeat: 1, pitch: N.E4 },
				{ startBeat: 2, pitch: N.G4 },
			]);
		});

		it("negative rotation wraps backwards", () => {
			// Rotate by -1 is same as rotate by (n-1)
			const forward = rotate(sequence(N.C4(1), N.E4(1), N.G4(1)), 2);
			const backward = rotate(sequence(N.C4(1), N.E4(1), N.G4(1)), -1);
			expect(collectNotes(forward).map((positionedNote) => pitchKey(positionedNote.pitch))).toEqual(
				collectNotes(backward).map((positionedNote) => pitchKey(positionedNote.pitch)),
			);
		});

		it("preserves total duration", () => {
			const pat = rotate(sequence(N.C4(1), N.E4(1)), 1);
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});

		it("returns empty for empty child", () => {
			expect(collectNotes(rotate(sequence(), 1))).toEqual([]);
		});
	});

	describe("instanceof", () => {
		it("is a RotatePattern", () => {
			expect(rotate(sequence(N.C4(1)), 0)).toBeInstanceOf(RotatePattern);
		});
	});
});
