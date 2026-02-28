import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { N } from "../tunings/chromatic";
import { sequence } from "./sequence";
import { TempoPattern, tempo } from "./tempo";

describe("TempoPattern", () => {
	it("creates TempoPattern with bpm", () => {
		const t = tempo(sequence(N.C4(1)), 140);
		expect(t).toBeInstanceOf(TempoPattern);
		expect(t.bpm).toBe(140);
	});

	it("throws for bpm <= 0", () => {
		expect(() => tempo(sequence(N.C4(1)), 0)).toThrow(ResequenceError);
		expect(() => tempo(sequence(N.C4(1)), -10)).toThrow("bpm must be greater than 0");
	});

	describe("keyframes", () => {
		it("constructs with keyframes and normalizes BPM to 0-1", () => {
			const pattern = tempo(sequence(N.C4(1)), 120, {
				keyframes: [{ beat: 4, bpm: 140 }],
			});
			expect(pattern.bpm).toBe(120);
			expect(pattern.bpmMin).toBe(120);
			expect(pattern.bpmMax).toBe(140);
			expect(pattern.keyframes).toEqual([{ beat: 4, value: 1.0 }]);
		});

		it("rejects keyframe with negative beat", () => {
			expect(() =>
				tempo(sequence(N.C4(1)), 120, {
					keyframes: [{ beat: -1, bpm: 140 }],
				}),
			).toThrow(ResequenceError);
		});

		it("rejects keyframe with zero bpm", () => {
			expect(() =>
				tempo(sequence(N.C4(1)), 120, {
					keyframes: [{ beat: 0, bpm: 0 }],
				}),
			).toThrow(ResequenceError);
		});
	});
});
