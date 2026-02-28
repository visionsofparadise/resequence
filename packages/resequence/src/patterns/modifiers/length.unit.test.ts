import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { LengthPattern, length } from "./length";

describe("LengthPattern", () => {
	describe("notes", () => {
		it("sets all note durations to the given value", () => {
			const pat = length(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), 120);
			expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 120 });
			expect(collectNotes(pat)[1]).toMatchObject({ startBeat: 1, endBeat: 121 });
		});

		it("preserves pitch", () => {
			const pat = length(sequence(note(resolvePitch("G4"), resolveDuration("4n"))), 100);
			expect(collectNotes(pat)[0]!.pitch).toEqual(resolvePitch("G4"));
		});

		it("accepts musical notation for duration", () => {
			const pat = length(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "16n");
			expect(collectNotes(pat)[0]).toMatchObject({ endBeat: 0.25 });
		});
	});

	describe("durationBeats", () => {
		it("adjusts duration to match new note length", () => {
			expect(length(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), resolveDuration("4n")).endBeat - length(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), resolveDuration("4n")).startBeat).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a LengthPattern", () => {
			expect(length(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 100)).toBeInstanceOf(LengthPattern);
		});
	});
});
