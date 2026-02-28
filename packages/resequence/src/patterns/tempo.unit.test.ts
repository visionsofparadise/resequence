import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { N } from "../tunings/chromatic";
import { sequence } from "./sequence";
import { TempoPattern, tempo } from "./tempo";
import { collectNotes } from "./utils/tree";

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

	it("delegates durationBeats to child", () => {
		const t = tempo(sequence(N.C4(1)), 120);
		expect(t.endBeat - t.startBeat).toBe(1);
	});

	it("delegates sequence duration", () => {
		const t = tempo(sequence(N.C4(1), N.E4(1)), 120);
		expect(t.endBeat - t.startBeat).toBe(2);
	});

	it("delegates notes to child", () => {
		const t = tempo(sequence(N.C4(1)), 120);
		const notes = collectNotes(t);
		expect(notes).toMatchObject([{ startBeat: 0, pitch: N.C4 }]);
	});

	describe("keyframes", () => {
		it("constructs with keyframes", () => {
			const pattern = tempo(sequence(N.C4(1)), 120, {
				keyframes: [{ beat: 4, bpm: 140, curve: "linear" }],
			});
			expect(pattern.bpm).toBe(120);
			expect(pattern.keyframes).toEqual([{ beat: 4, bpm: 140, curve: "linear" }]);
		});

		it("constructs with override", () => {
			const pattern = tempo(sequence(N.C4(1)), 140, { override: true });
			expect(pattern.isOverride).toBe(true);
		});

		it("static tempo defaults", () => {
			const pattern = tempo(sequence(N.C4(1)), 120);
			expect(pattern.bpm).toBe(120);
			expect(pattern.keyframes).toEqual([]);
			expect(pattern.isOverride).toBe(false);
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
