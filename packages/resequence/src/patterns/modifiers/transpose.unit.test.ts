import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { TransposePattern, transpose } from "./transpose";

describe("TransposePattern", () => {
	describe("notes", () => {
		it("shifts all pitches by interval", () => {
			const pat = transpose(sequence(note("C4", "4n"), note("E4", "4n")), 7);
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("G4") },
				{ beat: 1, pitch: resolvePitch("B4") },
			]);
		});

		it("returns empty notes for empty child", () => {
			expect(transpose(sequence(), 5).notes).toEqual([]);
		});

		it("supports negative interval", () => {
			expect(transpose(note("C4", "4n"), -12).notes[0]?.pitch).toEqual(resolvePitch("C3"));
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(transpose(note("C4", "2n"), 3).durationBeats).toBe(2);
		});
	});

	describe("route", () => {
		it("is an instance of TransposePattern", () => {
			expect(transpose(note("C4", "4n"), 1)).toBeInstanceOf(TransposePattern);
		});
	});
});
