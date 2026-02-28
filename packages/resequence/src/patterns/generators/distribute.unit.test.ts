import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { collectNotes } from "../utils/tree";
import { DistributePattern, distribute } from "./distribute";

describe("DistributePattern", () => {
	describe("notes", () => {
		it("distributes hits as evenly as possible across steps", () => {
			// distribute(3, 8) -> [x . . x . . x .] = hits at steps 0, 3, 6
			const pat = distribute(3, 8, 60, 120);
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(3);
			expect(notes[0]!.startBeat).toBe(0);
			expect(notes[1]!.startBeat).toBe(360); // step 3 x 120
			expect(notes[2]!.startBeat).toBe(720); // step 6 x 120
		});

		it("produces all hits when hits equals steps", () => {
			const pat = distribute(4, 4, 60, 120);
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(4);
		});

		it("produces no notes when hits is zero", () => {
			const pat = distribute(0, 8, 60, 120);
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(0);
		});

		it("assigns the given pitch to all notes", () => {
			const pat = distribute(3, 8, 67, 120); // G4 = 67
			const notes = collectNotes(pat);
			for (const positionedNote of notes) {
				expect(positionedNote.pitch).toEqual(resolvePitch("G4"));
			}
		});

		it("each note has stepDuration as its duration", () => {
			const pat = distribute(3, 8, 60, 120);
			const notes = collectNotes(pat);
			for (const positionedNote of notes) {
				expect(positionedNote.endBeat - positionedNote.startBeat).toBe(120);
			}
		});

		it("rotates the pattern by the specified steps", () => {
			// distribute(3, 8) without rotate: [T,F,F,T,F,F,T,F] -> hits at steps 0, 3, 6
			// rotate by 1 shifts left: [F,F,T,F,F,T,F,T] -> hits at steps 2, 5, 7
			const pat = distribute(3, 8, 60, 120, 1);
			const notes = collectNotes(pat);
			expect(notes[0]!.startBeat).toBe(240); // step 2 x 120
			expect(notes[1]!.startBeat).toBe(600); // step 5 x 120
			expect(notes[2]!.startBeat).toBe(840); // step 7 x 120
		});

		it("accepts musical notation for stepDuration", () => {
			const pat = distribute(2, 4, 60, "8n");
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(2);
			expect(notes[0]!.endBeat - notes[0]!.startBeat).toBe(0.5); // 8n = 0.5 beats
		});
	});

	describe("durationBeats", () => {
		it("equals steps x stepDuration", () => {
			const pat = distribute(3, 8, 60, 120);
			expect(pat.endBeat - pat.startBeat).toBe(960); // 8 x 120
		});
	});

	describe("instanceof", () => {
		it("is a DistributePattern", () => {
			expect(distribute(3, 8, 60, 120)).toBeInstanceOf(DistributePattern);
		});
	});
});
