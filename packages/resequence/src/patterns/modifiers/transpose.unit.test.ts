import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { TransposePattern, transpose } from "./transpose";

describe("TransposePattern", () => {
	describe("notes", () => {
		it("shifts all pitches by interval", () => {
			const pat = transpose(sequence(note("C4", "4n"), note("E4", "4n")), 7);
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 67 },
				{ tick: 480, pitch: 71 },
			]);
		});

		it("returns empty notes for empty child", () => {
			expect(transpose(sequence(), 5).notes).toEqual([]);
		});

		it("supports negative interval", () => {
			expect(transpose(note("C4", "4n"), -12).notes[0]?.pitch).toBe(48);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(transpose(note("C4", "2n"), 3).durationTicks).toBe(960);
		});
	});

	describe("route", () => {
		it("is an instance of TransposePattern", () => {
			expect(transpose(note("C4", "4n"), 1)).toBeInstanceOf(TransposePattern);
		});
	});
});
