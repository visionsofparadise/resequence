import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { FormulaPattern, formula } from "./formula";

describe("FormulaPattern", () => {
	describe("notes", () => {
		it("builds a scale run by adding a note each step", () => {
			// 8 steps of 8n (0.5 beats each), each step adds C major scale degree
			const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C major
			const pat = formula(
				(acc, stepIndex, _total) => {
					acc.push({ beat: stepIndex * 0.5, pitch: resolvePitch(scale[stepIndex]!), durationBeats: 0.5 });
					return acc;
				},
				8,
				"8n",
			);
			expect(pat.notes).toHaveLength(8);
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch(60)); // C4
			expect(pat.notes[7]!.pitch).toEqual(resolvePitch(72)); // C5
		});

		it("can apply velocity crescendo", () => {
			const pat = formula(
				(acc, stepIndex, total) => {
					const velocity = Math.round(40 + (stepIndex / (total - 1)) * 87); // 40 → 127
					acc.push({ beat: stepIndex * 1, pitch: resolvePitch(60), durationBeats: 1, velocity });
					return acc;
				},
				4,
				"4n",
			);
			expect(pat.notes[0]!.velocity).toBeLessThan(pat.notes[3]!.velocity);
		});

		it("receives the accumulator from the previous step", () => {
			// Count how many notes were in the acc at each call
			const accSizes: Array<number> = [];
			formula(
				(acc, stepIndex) => {
					accSizes.push(acc.length);
					acc.push({ beat: stepIndex * 0.5, pitch: resolvePitch(60), durationBeats: 0.5 });
					return acc;
				},
				3,
				"8n",
			);
			expect(accSizes).toEqual([0, 1, 2]); // acc grows each step
		});

		it("produces empty notes when count is zero", () => {
			const pat = formula((acc) => acc, 0, "4n");
			expect(pat.notes).toHaveLength(0);
		});
	});

	describe("durationBeats", () => {
		it("equals count × stepDuration", () => {
			expect(formula((acc) => acc, 4, "4n").durationBeats).toBe(4); // 4 × 1
		});
	});

	describe("instanceof", () => {
		it("is a FormulaPattern", () => {
			expect(formula((acc) => acc, 4, "4n")).toBeInstanceOf(FormulaPattern);
		});
	});
});
