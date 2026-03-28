import { generative } from "./generative";
import { N, collectNotes, pitchKey } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("generative", () => {
	it("builds a scale run by adding a note each step", () => {
		const scale = [N.C4(1), N.D4(1), N.E4(1), N.F4(1), N.G4(1), N.A4(1), N.B4(1), N.C5(1)];
		const pat = generative(
			(acc, stepIndex) => {
				const n = scale[stepIndex]!;
				acc.push({ pitch: n.pitch, startBeat: stepIndex * 0.5, endBeat: stepIndex * 0.5 + 0.5, velocity: 100 });
				return acc;
			},
			8,
			0.5 * 8,
		);
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(8);
		expect(pitchKey(notes[0]!.note.pitch)).toBe(pitchKey(N.C4(1).pitch));
		expect(pitchKey(notes[7]!.note.pitch)).toBe(pitchKey(N.C5(1).pitch));
	});

	it("receives the accumulator from the previous step", () => {
		const accSizes: Array<number> = [];
		generative(
			(acc, stepIndex) => {
				accSizes.push(acc.length);
				acc.push({ pitch: N.C4(1).pitch, startBeat: stepIndex * 0.5, endBeat: stepIndex * 0.5 + 0.5, velocity: 100 });
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
