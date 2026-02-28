import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { pitchKey } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { TransposePattern, transpose } from "./transpose";

describe("TransposePattern", () => {
	describe("notes", () => {
		it("shifts all pitches by interval", () => {
			const pat = transpose(sequence(N.C4(1), N.E4(1)), 7);
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(2);
			expect(notes[0]!.startBeat).toBe(0);
			expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.G4));
			expect(notes[1]!.startBeat).toBe(1);
			expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.B4));
		});
		it("returns empty notes for empty child", () => {
			expect(collectNotes(transpose(sequence(), 5))).toEqual([]);
		});
		it("supports negative interval", () => {
			expect(pitchKey(collectNotes(transpose(sequence(N.C4(1)), -12))[0]!.pitch)).toBe(pitchKey(N.C3));
		});
	});
	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(transpose(sequence(N.C4(2)), 3).endBeat - transpose(sequence(N.C4(2)), 3).startBeat).toBe(2);
		});
	});
	describe("route", () => {
		it("is an instance of TransposePattern", () => {
			expect(transpose(sequence(N.C4(1)), 1)).toBeInstanceOf(TransposePattern);
		});
	});
});
