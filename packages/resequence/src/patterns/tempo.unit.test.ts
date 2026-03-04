import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { N } from "../tunings/chromatic";
import { sequence } from "./sequence";
import { TempoPattern, normalizeBpm, tempo } from "./tempo";

describe("TempoPattern", () => {
	it("creates TempoPattern with bpm", () => {
		const t = tempo(sequence(N.C4(1)), 140);
		expect(t).toBeInstanceOf(TempoPattern);
		expect(t.properties.bpm).toBe(140);
	});

	it("throws for bpm <= 0", () => {
		expect(() => tempo(sequence(N.C4(1)), 0)).toThrow(ResequenceError);
		expect(() => tempo(sequence(N.C4(1)), -10)).toThrow("bpm must be greater than 0");
	});

	describe("keyframes", () => {
		it("stores normalized keyframe values", () => {
			const pattern = tempo(sequence(N.C4(1)), 120, {
				keyframes: [{ beat: 4, value: normalizeBpm(140) }],
			});
			expect(pattern.properties.bpm).toBe(120);
			expect(pattern.properties.keyframes).toEqual([{ beat: 4, value: 0.14 }]);
		});

		it("rejects keyframe with negative beat", () => {
			expect(() =>
				tempo(sequence(N.C4(1)), 120, {
					keyframes: [{ beat: -1, value: normalizeBpm(140) }],
				}),
			).toThrow(ResequenceError);
		});

		it("rejects keyframe with negative value", () => {
			expect(() =>
				tempo(sequence(N.C4(1)), 120, {
					keyframes: [{ beat: 0, value: -0.1 }],
				}),
			).toThrow(ResequenceError);
		});
	});
});
