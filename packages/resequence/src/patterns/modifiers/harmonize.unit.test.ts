import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { HarmonizePattern, harmonize } from "./harmonize";

describe("HarmonizePattern", () => {
	describe("notes", () => {
		it("doubles each note at the parallel interval", () => {
			const pat = harmonize(note("C4", "4n"), 7);
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 60 },
				{ tick: 0, pitch: 67 },
			]);
		});

		it("produces 2x the original note count", () => {
			const pat = harmonize(sequence(note("C4", "8n"), note("E4", "8n")), 4);
			expect(pat.notes).toHaveLength(4);
		});

		it("each pair shares the same tick and duration", () => {
			const pat = harmonize(note("C4", "4n"), 5);
			expect(pat.notes[0]?.tick).toBe(pat.notes[1]?.tick);
			expect(pat.notes[0]?.durationTicks).toBe(pat.notes[1]?.durationTicks);
		});

		it("returns empty for empty child", () => {
			expect(harmonize(sequence(), 4).notes).toEqual([]);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(harmonize(note("C4", "2n"), 3).durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is a HarmonizePattern", () => {
			expect(harmonize(note("C4", "4n"), 7)).toBeInstanceOf(HarmonizePattern);
		});
	});
});
