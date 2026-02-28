import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { collectNotes } from "../utils/tree";
import { GenerativePattern, generative } from "./generative";

describe("GenerativePattern", () => {
	describe("notes", () => {
		it("builds a scale run by adding a note each step", () => {
			// 8 steps of 8n (0.5 beats each), each step adds C major scale degree
			const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C major
			const pat = generative(
				(acc, stepIndex, _total) => {
					acc.push({ startBeat: stepIndex * 0.5, endBeat: stepIndex * 0.5 + 0.5, pitch: resolvePitch(scale[stepIndex]!), velocity: 100 });
					return acc;
				},
				8,
				resolveDuration("8n") * 8,
			);
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(8);
			expect(notes[0]!.pitch).toEqual(resolvePitch(60)); // C4
			expect(notes[7]!.pitch).toEqual(resolvePitch(72)); // C5
		});

		it("can apply velocity crescendo", () => {
			const pat = generative(
				(acc, stepIndex, total) => {
					const velocity = Math.round(40 + (stepIndex / (total - 1)) * 87); // 40 → 127
					acc.push({ startBeat: stepIndex * 1, endBeat: stepIndex * 1 + 1, pitch: resolvePitch(60), velocity });
					return acc;
				},
				4,
				4,
			);
			const notes = collectNotes(pat);
			expect(notes[0]!.velocity).toBeLessThan(notes[3]!.velocity);
		});

		it("receives the accumulator from the previous step", () => {
			// Count how many notes were in the acc at each call
			const accSizes: Array<number> = [];
			generative(
				(acc, stepIndex) => {
					accSizes.push(acc.length);
					acc.push({ startBeat: stepIndex * 0.5, endBeat: stepIndex * 0.5 + 0.5, pitch: resolvePitch(60), velocity: 100 });
					return acc;
				},
				3,
				resolveDuration("8n") * 3,
			);
			expect(accSizes).toEqual([0, 1, 2]); // acc grows each step
		});

		it("produces empty notes when count is zero", () => {
			const pat = generative((acc) => acc, 0, resolveDuration("4n"));
			expect(collectNotes(pat)).toHaveLength(0);
		});
	});

	describe("durationBeats", () => {
		it("equals count × stepDuration", () => {
			expect(generative((acc) => acc, 4, 4).durationBeats).toBe(4); // 4 × 1
		});
	});

	describe("instanceof", () => {
		it("is a GenerativePattern", () => {
			expect(generative((acc) => acc, 4, 4)).toBeInstanceOf(GenerativePattern);
		});
	});
});
