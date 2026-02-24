import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { LengthPattern, length } from "./length";

describe("LengthPattern", () => {
	describe("notes", () => {
		it("sets all note durations to the given value", () => {
			const pat = length(sequence(note("C4", "4n"), note("E4", "4n")), 120);
			expect(pat.notes[0]).toMatchObject({ tick: 0, durationTicks: 120 });
			expect(pat.notes[1]).toMatchObject({ tick: 480, durationTicks: 120 });
		});

		it("preserves pitch", () => {
			const pat = length(note("G4", "4n"), 100);
			expect(pat.notes[0]!.pitch).toBe(67);
		});

		it("accepts musical notation for duration", () => {
			const pat = length(note("C4", "4n"), "16n");
			expect(pat.notes[0]).toMatchObject({ durationTicks: 120 });
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(length(note("C4", "4n"), 100).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is a LengthPattern", () => {
			expect(length(note("C4", "4n"), 100)).toBeInstanceOf(LengthPattern);
		});
	});
});
