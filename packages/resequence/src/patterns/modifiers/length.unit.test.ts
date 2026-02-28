import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { LengthPattern, length } from "./length";

describe("LengthPattern", () => {
	describe("notes", () => {
		it("sets all note durations to the given value", () => {
			const pat = length(sequence(N.C4(1), N.E4(1)), 120);
			expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 120 });
			expect(collectNotes(pat)[1]).toMatchObject({ startBeat: 1, endBeat: 121 });
		});

		it("preserves pitch", () => {
			const pat = length(sequence(N.G4(1)), 100);
			expect(collectNotes(pat)[0]!.pitch).toEqual(N.G4);
		});

		it("accepts musical notation for duration", () => {
			const pat = length(sequence(N.C4(1)), 0.25);
			expect(collectNotes(pat)[0]).toMatchObject({ endBeat: 0.25 });
		});
	});

	describe("durationBeats", () => {
		it("adjusts duration to match new note length", () => {
			expect(length(sequence(N.C4(1)), 1).endBeat - length(sequence(N.C4(1)), 1).startBeat).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a LengthPattern", () => {
			expect(length(sequence(N.C4(1)), 100)).toBeInstanceOf(LengthPattern);
		});
	});
});
