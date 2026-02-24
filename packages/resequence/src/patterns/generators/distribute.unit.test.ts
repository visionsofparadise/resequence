import { describe, expect, it } from "vitest";
import { DistributePattern, distribute } from "./distribute";

describe("DistributePattern", () => {
	describe("notes", () => {
		it("distributes hits as evenly as possible across steps", () => {
			// distribute(3, 8) → [x . . x . . x .] = hits at steps 0, 3, 6
			const pat = distribute(3, 8, 60, 120);
			expect(pat.notes).toHaveLength(3);
			expect(pat.notes[0]!.tick).toBe(0);
			expect(pat.notes[1]!.tick).toBe(360); // step 3 × 120
			expect(pat.notes[2]!.tick).toBe(720); // step 6 × 120
		});

		it("produces all hits when hits equals steps", () => {
			const pat = distribute(4, 4, 60, 120);
			expect(pat.notes).toHaveLength(4);
		});

		it("produces no notes when hits is zero", () => {
			const pat = distribute(0, 8, 60, 120);
			expect(pat.notes).toHaveLength(0);
		});

		it("assigns the given pitch to all notes", () => {
			const pat = distribute(3, 8, 67, 120); // G4 = 67
			for (const positionedNote of pat.notes) {
				expect(positionedNote.pitch).toBe(67);
			}
		});

		it("each note has stepDuration as its duration", () => {
			const pat = distribute(3, 8, 60, 120);
			for (const positionedNote of pat.notes) {
				expect(positionedNote.durationTicks).toBe(120);
			}
		});

		it("rotates the pattern by the specified steps", () => {
			// distribute(3, 8) without rotate: [T,F,F,T,F,F,T,F] → hits at steps 0, 3, 6
			// rotate by 1 shifts left: [F,F,T,F,F,T,F,T] → hits at steps 2, 5, 7
			const pat = distribute(3, 8, 60, 120, 1);
			expect(pat.notes[0]!.tick).toBe(240); // step 2 × 120
			expect(pat.notes[1]!.tick).toBe(600); // step 5 × 120
			expect(pat.notes[2]!.tick).toBe(840); // step 7 × 120
		});

		it("accepts musical notation for stepDuration", () => {
			const pat = distribute(2, 4, 60, "8n");
			expect(pat.notes).toHaveLength(2);
			expect(pat.notes[0]!.durationTicks).toBe(240); // 8n = 240 ticks
		});
	});

	describe("durationTicks", () => {
		it("equals steps × stepDuration", () => {
			expect(distribute(3, 8, 60, 120).durationTicks).toBe(960); // 8 × 120
		});
	});

	describe("instanceof", () => {
		it("is a DistributePattern", () => {
			expect(distribute(3, 8, 60, 120)).toBeInstanceOf(DistributePattern);
		});
	});
});
