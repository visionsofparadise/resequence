import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { collectNotes } from "../utils/tree";
import { generative } from "./generative";

describe("GenerativePattern", () => {
	describe("notes", () => {
		it("builds a scale run by adding a note each step", () => {
			const scale = [N.C4, N.D4, N.E4, N.F4, N.G4, N.A4, N.B4, N.C5];
			const pat = generative(
				(acc, stepIndex, _total) => {
					acc.push({ startBeat: stepIndex * 0.5, endBeat: stepIndex * 0.5 + 0.5, pitch: scale[stepIndex]!, velocity: 100 });
					return acc;
				},
				8,
				0.5 * 8,
			);
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(8);
			expect(notes[0]!.pitch).toEqual(N.C4);
			expect(notes[7]!.pitch).toEqual(N.C5);
		});
		it("receives the accumulator from the previous step", () => {
			const accSizes: Array<number> = [];
			generative(
				(acc, stepIndex) => {
					accSizes.push(acc.length);
					acc.push({ startBeat: stepIndex * 0.5, endBeat: stepIndex * 0.5 + 0.5, pitch: N.C4, velocity: 100 });
					return acc;
				},
				3,
				0.5 * 3,
			);
			expect(accSizes).toEqual([0, 1, 2]);
		});
		it("produces empty notes when count is zero", () => {
			const pat = generative((acc) => acc, 0, 1);
			expect(collectNotes(pat)).toHaveLength(0);
		});
	});
});
