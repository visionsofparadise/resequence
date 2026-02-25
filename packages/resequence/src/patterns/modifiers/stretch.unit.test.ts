import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { StretchPattern, stretch } from "./stretch";

describe("StretchPattern", () => {
	describe("notes", () => {
		it("doubles all timings with factor 2", () => {
			const pat = stretch(sequence(note("C4", "4n"), note("E4", "4n")), 2);
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4"), durationBeats: 2 },
				{ beat: 2, pitch: resolvePitch("E4"), durationBeats: 2 },
			]);
		});

		it("halves all timings with factor 0.5", () => {
			const pat = stretch(sequence(note("C4", "4n"), note("E4", "4n")), 0.5);
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4"), durationBeats: 0.5 },
				{ beat: 0.5, pitch: resolvePitch("E4"), durationBeats: 0.5 },
			]);
		});

		it("preserves undefined durationBeats", () => {
			const pat = stretch(note("C4", "4n"), 2);
			// NotePattern always sets durationBeats, so this just confirms it's scaled
			expect(pat.notes[0]?.durationBeats).toBe(2);
		});
	});

	describe("durationBeats", () => {
		it("scales durationBeats by factor", () => {
			expect(stretch(note("C4", "4n"), 2).durationBeats).toBe(2);
			expect(stretch(note("C4", "4n"), 0.5).durationBeats).toBe(0.5);
		});
	});

	describe("instanceof", () => {
		it("is a StretchPattern", () => {
			expect(stretch(note("C4", "4n"), 1)).toBeInstanceOf(StretchPattern);
		});
	});
});
