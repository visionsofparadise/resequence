import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { LengthPattern, length } from "./length";

describe("LengthPattern", () => {
	describe("notes", () => {
		it("sets all note durations to the given value", () => {
			const pat = length(sequence(note("C4", "4n"), note("E4", "4n")), 120);
			expect(pat.notes[0]).toMatchObject({ beat: 0, durationBeats: 120 });
			expect(pat.notes[1]).toMatchObject({ beat: 1, durationBeats: 120 });
		});

		it("preserves pitch", () => {
			const pat = length(note("G4", "4n"), 100);
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("G4"));
		});

		it("accepts musical notation for duration", () => {
			const pat = length(note("C4", "4n"), "16n");
			expect(pat.notes[0]).toMatchObject({ durationBeats: 0.25 });
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(length(note("C4", "4n"), 100).durationBeats).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a LengthPattern", () => {
			expect(length(note("C4", "4n"), 100)).toBeInstanceOf(LengthPattern);
		});
	});
});
