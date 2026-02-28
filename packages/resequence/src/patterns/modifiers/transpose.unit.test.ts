import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { TransposePattern, transpose } from "./transpose";

describe("TransposePattern", () => {
	describe("notes", () => {
		it("shifts all pitches by interval", () => {
			const pat = transpose(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), 7);
			expect(collectNotes(pat)).toMatchObject([
				{ startBeat: 0, pitch: resolvePitch("G4") },
				{ startBeat: 1, pitch: resolvePitch("B4") },
			]);
		});

		it("returns empty notes for empty child", () => {
			expect(collectNotes(transpose(sequence(), 5))).toEqual([]);
		});

		it("supports negative interval", () => {
			expect(collectNotes(transpose(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), -12))[0]?.pitch).toEqual(resolvePitch("C3"));
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(transpose(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), 3).endBeat - transpose(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), 3).startBeat).toBe(2);
		});
	});

	describe("route", () => {
		it("is an instance of TransposePattern", () => {
			expect(transpose(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 1)).toBeInstanceOf(TransposePattern);
		});
	});
});
