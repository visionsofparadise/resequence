import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { SlicePattern, TrimPattern, slice, trim } from "./slice";

describe("slice", () => {
	describe("notes", () => {
		it("keeps notes at the specified index range", () => {
			const pat = slice(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 1, 3);
			expect(pat.notes).toHaveLength(2);
			expect(pat.notes[0]!.pitch).toBe(64); // E4
			expect(pat.notes[1]!.pitch).toBe(67); // G4
		});

		it("shifts ticks so the first kept note starts at zero", () => {
			const pat = slice(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 1, 3);
			expect(pat.notes[0]!.tick).toBe(0); // E4 was at 480, shifted to 0
			expect(pat.notes[1]!.tick).toBe(480); // G4 was at 960, shifted to 480
		});

		it("returns empty notes and zero duration when range is empty", () => {
			const pat = slice(note("C4", "4n"), 5, 10);
			expect(pat.notes).toHaveLength(0);
			expect(pat.durationTicks).toBe(0);
		});
	});

	describe("durationTicks", () => {
		it("equals the span of kept notes", () => {
			const pat = slice(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 0, 2);
			// notes at tick 0 and 480, each dur 480 → span = 480+480-0 = 960
			expect(pat.durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is a SlicePattern", () => {
			expect(slice(note("C4", "4n"), 0, 1)).toBeInstanceOf(SlicePattern);
		});
	});
});

describe("trim", () => {
	describe("notes", () => {
		it("keeps notes within the time window", () => {
			const pat = trim(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 480, 960);
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]!.pitch).toBe(64); // E4 at tick 480
		});

		it("shifts ticks relative to window start", () => {
			const pat = trim(sequence(note("C4", "4n"), note("E4", "4n")), 480, 960);
			expect(pat.notes[0]!.tick).toBe(0); // E4 was at 480, shifted to 0
		});

		it("clips notes that span the window boundary", () => {
			// C4@0 dur 480 [0,480), trim window [240, 480) → clip to [240,480) → tick=0 dur=240
			const pat = trim(note("C4", "4n"), 240, 480);
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]).toMatchObject({ tick: 0, durationTicks: 240 });
		});

		it("accepts musical notation for window bounds", () => {
			const pat = trim(sequence(note("C4", "4n"), note("E4", "4n")), "4n", "2n");
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]!.pitch).toBe(64); // E4 at tick 480
		});
	});

	describe("durationTicks", () => {
		it("equals to - from", () => {
			expect(trim(note("C4", "2n"), 0, 480).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is a TrimPattern", () => {
			expect(trim(note("C4", "4n"), 0, 240)).toBeInstanceOf(TrimPattern);
		});
	});
});
