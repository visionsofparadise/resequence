import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { resolvePitch } from "../utils/pitch";
import { note } from "./note";
import { sequence } from "./sequence";
import { TempoPattern, tempo } from "./tempo";

describe("TempoPattern", () => {
	it("creates TempoPattern with bpm", () => {
		const t = tempo(note("C4", "4n"), 140);
		expect(t).toBeInstanceOf(TempoPattern);
		expect(t.bpm).toBe(140);
		expect(t.type).toBe("tempo");
	});

	it("throws for bpm <= 0", () => {
		expect(() => tempo(note("C4", "4n"), 0)).toThrow(ResequenceError);
		expect(() => tempo(note("C4", "4n"), -10)).toThrow("bpm must be greater than 0");
	});

	it("delegates durationBeats to child", () => {
		const t = tempo(note("C4", "4n"), 120);
		expect(t.durationBeats).toBe(1);
	});

	it("delegates sequence duration", () => {
		const t = tempo(sequence(note("C4", "4n"), note("E4", "4n")), 120);
		expect(t.durationBeats).toBe(2);
	});

	it("delegates notes to child", () => {
		const t = tempo(note("C4", "4n"), 120);
		expect(t.notes).toMatchObject([{ beat: 0, pitch: resolvePitch("C4") }]);
	});

	it("passes through child metadatas", () => {
		const t = tempo(note("C4", "4n"), 120);
		expect(t.metadatas).toEqual([]);
	});

	describe("keyframes", () => {
		it("constructs with keyframes", () => {
			const pattern = tempo(note("C4", "4n"), 120, {
				keyframes: [{ beat: 4, bpm: 140, curve: "linear" }],
			});
			expect(pattern.bpm).toBe(120);
			expect(pattern.keyframes).toEqual([{ beat: 4, bpm: 140, curve: "linear" }]);
		});

		it("constructs with override", () => {
			const pattern = tempo(note("C4", "4n"), 140, { override: true });
			expect(pattern.isOverride).toBe(true);
		});

		it("static tempo defaults", () => {
			const pattern = tempo(note("C4", "4n"), 120);
			expect(pattern.bpm).toBe(120);
			expect(pattern.keyframes).toEqual([]);
			expect(pattern.isOverride).toBe(false);
		});

		it("rejects keyframe with negative beat", () => {
			expect(() =>
				tempo(note("C4", "4n"), 120, {
					keyframes: [{ beat: -1, bpm: 140 }],
				}),
			).toThrow(ResequenceError);
		});

		it("rejects keyframe with zero bpm", () => {
			expect(() =>
				tempo(note("C4", "4n"), 120, {
					keyframes: [{ beat: 0, bpm: 0 }],
				}),
			).toThrow(ResequenceError);
		});
	});
});
