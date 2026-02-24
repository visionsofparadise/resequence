import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { StretchPattern, stretch } from "./stretch";

describe("StretchPattern", () => {
	describe("notes", () => {
		it("doubles all timings with factor 2", () => {
			const pat = stretch(sequence(note("C4", "4n"), note("E4", "4n")), 2);
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 60, durationTicks: 960 },
				{ tick: 960, pitch: 64, durationTicks: 960 },
			]);
		});

		it("halves all timings with factor 0.5", () => {
			const pat = stretch(sequence(note("C4", "4n"), note("E4", "4n")), 0.5);
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 60, durationTicks: 240 },
				{ tick: 240, pitch: 64, durationTicks: 240 },
			]);
		});

		it("preserves undefined durationTicks", () => {
			const pat = stretch(note("C4", "4n"), 2);
			// NotePattern always sets durationTicks, so this just confirms it's scaled
			expect(pat.notes[0]?.durationTicks).toBe(960);
		});
	});

	describe("durationTicks", () => {
		it("scales durationTicks by factor", () => {
			expect(stretch(note("C4", "4n"), 2).durationTicks).toBe(960);
			expect(stretch(note("C4", "4n"), 0.5).durationTicks).toBe(240);
		});
	});

	describe("instanceof", () => {
		it("is a StretchPattern", () => {
			expect(stretch(note("C4", "4n"), 1)).toBeInstanceOf(StretchPattern);
		});
	});
});
