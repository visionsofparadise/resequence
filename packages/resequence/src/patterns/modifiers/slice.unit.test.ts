import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { SlicePattern, TrimPattern, slice, trim } from "./slice";

describe("slice", () => {
	describe("notes", () => {
		it("keeps notes at the specified index range", () => {
			const pat = slice(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 1, 3);
			expect(pat.notes).toHaveLength(2);
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("E4"));
			expect(pat.notes[1]!.pitch).toEqual(resolvePitch("G4"));
		});

		it("shifts beats so the first kept note starts at zero", () => {
			const pat = slice(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 1, 3);
			expect(pat.notes[0]!.beat).toBe(0); // E4 was at 1, shifted to 0
			expect(pat.notes[1]!.beat).toBe(1); // G4 was at 2, shifted to 1
		});

		it("returns empty notes and zero duration when range is empty", () => {
			const pat = slice(note("C4", "4n"), 5, 10);
			expect(pat.notes).toHaveLength(0);
			expect(pat.durationBeats).toBe(0);
		});
	});

	describe("durationBeats", () => {
		it("equals the span of kept notes", () => {
			const pat = slice(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 0, 2);
			// notes at beat 0 and 1, each dur 1 → span = 1+1-0 = 2
			expect(pat.durationBeats).toBe(2);
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
			const pat = trim(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), 1, 2);
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("E4")); // E4 at beat 1
		});

		it("shifts beats relative to window start", () => {
			const pat = trim(sequence(note("C4", "4n"), note("E4", "4n")), 1, 2);
			expect(pat.notes[0]!.beat).toBe(0); // E4 was at beat 1, shifted to 0
		});

		it("clips notes that span the window boundary", () => {
			// C4@0 dur 1 beat, trim window [0.5, 1) → clip to [0.5,1), beat=0 dur=0.5
			const pat = trim(note("C4", "4n"), 0.5, 1);
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]).toMatchObject({ beat: 0, durationBeats: 0.5 });
		});

		it("accepts musical notation for window bounds", () => {
			const pat = trim(sequence(note("C4", "4n"), note("E4", "4n")), "4n", "2n");
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("E4")); // E4 at beat 1
		});
	});

	describe("durationBeats", () => {
		it("equals to - from", () => {
			expect(trim(note("C4", "2n"), 0, 1).durationBeats).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a TrimPattern", () => {
			expect(trim(note("C4", "4n"), 0, 0.5)).toBeInstanceOf(TrimPattern);
		});
	});
});
