import { describe, expect, it } from "vitest";
import { FormulaPattern, formula } from "./formula";

describe("FormulaPattern", () => {
	describe("notes", () => {
		it("builds a scale run by adding a note each step", () => {
			// 8 steps of 8n, each step adds C major scale degree
			const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C major
			const pat = formula(
				(acc, stepIndex, _total) => {
					acc.push({ tick: stepIndex * 240, pitch: scale[stepIndex]!, durationTicks: 240 });
					return acc;
				},
				8,
				"8n",
			);
			expect(pat.notes).toHaveLength(8);
			expect(pat.notes[0]!.pitch).toBe(60); // C4
			expect(pat.notes[7]!.pitch).toBe(72); // C5
		});

		it("can apply velocity crescendo", () => {
			const pat = formula(
				(acc, stepIndex, total) => {
					const velocity = Math.round(40 + (stepIndex / (total - 1)) * 87); // 40 → 127
					acc.push({ tick: stepIndex * 480, pitch: 60, durationTicks: 480, velocity });
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
					acc.push({ tick: stepIndex * 240, pitch: 60, durationTicks: 240 });
					return acc;
				},
				3,
				240,
			);
			expect(accSizes).toEqual([0, 1, 2]); // acc grows each step
		});

		it("produces empty notes when count is zero", () => {
			const pat = formula((acc) => acc, 0, "4n");
			expect(pat.notes).toHaveLength(0);
		});
	});

	describe("durationTicks", () => {
		it("equals count × stepDuration", () => {
			expect(formula((acc) => acc, 4, "4n").durationTicks).toBe(1920); // 4 × 480
		});
	});

	describe("instanceof", () => {
		it("is a FormulaPattern", () => {
			expect(formula((acc) => acc, 4, "4n")).toBeInstanceOf(FormulaPattern);
		});
	});
});
