import { describe, expect, it } from "vitest";
import { gap } from "../gap";
import { note } from "../note";
import { sequence } from "../sequence";
import { HealPattern, heal } from "./heal";

describe("HealPattern", () => {
	describe("notes", () => {
		it("merges consecutive same-pitch notes with zero gap", () => {
			// C4@0 dur 480, C4@480 dur 480 → C4@0 dur 960
			const pat = heal(sequence(note("C4", "4n"), note("C4", "4n")));
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]).toMatchObject({ tick: 0, pitch: 60, durationTicks: 960 });
		});

		it("does not merge notes with different pitch", () => {
			const pat = heal(sequence(note("C4", "4n"), note("E4", "4n")));
			expect(pat.notes).toHaveLength(2);
		});

		it("merges when gap is within threshold", () => {
			// C4@0 dur 400, gap 80, C4@480 dur 480 — gap is 80 ticks
			const pat = heal(sequence(note("C4", 400), gap(80), note("C4", "4n")), 100);
			expect(pat.notes).toHaveLength(1);
		});

		it("does not merge when gap exceeds threshold", () => {
			// C4@0 dur 400, gap 80, C4@480 dur 480 — gap is 80 ticks, threshold 50 < gap
			const pat = heal(sequence(note("C4", 400), gap(80), note("C4", "4n")), 50);
			expect(pat.notes).toHaveLength(2);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(heal(sequence(note("C4", "4n"), note("C4", "4n"))).durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is a HealPattern", () => {
			expect(heal(note("C4", "4n"))).toBeInstanceOf(HealPattern);
		});
	});
});
