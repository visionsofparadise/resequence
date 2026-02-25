import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { resolvePitch } from "../utils/pitch";
import { note } from "./note";
import { repeat } from "./repeat";
import { sequence } from "./sequence";

describe("RepeatPattern", () => {
	describe("validation", () => {
		it("rejects count less than 1", () => {
			expect(() => repeat(note("C4", "4n"), 0)).toThrow(ResequenceError);
			expect(() => repeat(note("C4", "4n"), 0)).toThrow("count must be a positive integer");
		});

		it("rejects negative count", () => {
			expect(() => repeat(note("C4", "4n"), -2)).toThrow(ResequenceError);
		});

		it("rejects non-integer count", () => {
			expect(() => repeat(note("C4", "4n"), 2.5)).toThrow(ResequenceError);
			expect(() => repeat(note("C4", "4n"), 2.5)).toThrow("count must be a positive integer");
		});

		it("accepts count of 1", () => {
			expect(repeat(note("C4", "4n"), 1).durationBeats).toBe(1);
		});
	});

	describe("durationBeats", () => {
		it("multiplies child duration by count", () => {
			expect(repeat(note("C4", "4n"), 4).durationBeats).toBe(4);
		});
	});

	describe("notes", () => {
		it("multiplies offsets", () => {
			const pat = repeat(note("C4", "4n"), 4);
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4") },
				{ beat: 1, pitch: resolvePitch("C4") },
				{ beat: 2, pitch: resolvePitch("C4") },
				{ beat: 3, pitch: resolvePitch("C4") },
			]);
		});

		it("handles repeat of a sequence", () => {
			const pat = repeat(sequence(note("C4", "8n"), note("E4", "8n")), 2);
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4") },
				{ beat: 0.5, pitch: resolvePitch("E4") },
				{ beat: 1, pitch: resolvePitch("C4") },
				{ beat: 1.5, pitch: resolvePitch("E4") },
			]);
		});
	});
});
