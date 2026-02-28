import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { pitchKey } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { HarmonizePattern, harmonize } from "./harmonize";

describe("HarmonizePattern", () => {
	describe("notes", () => {
		it("doubles each note at the parallel interval", () => {
			const pat = harmonize(sequence(N.C4(1)), 7);
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(2);
			expect(notes[0]!.startBeat).toBe(0);
			expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
			expect(notes[1]!.startBeat).toBe(0);
			expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.G4));
		});
		it("produces 2x the original note count", () => {
			const pat = harmonize(sequence(N.C4(0.5), N.E4(0.5)), 4);
			expect(collectNotes(pat)).toHaveLength(4);
		});
		it("each pair shares the same tick and duration", () => {
			const pat = harmonize(sequence(N.C4(1)), 5);
			const notes = collectNotes(pat);
			expect(notes[0]?.startBeat).toBe(notes[1]?.startBeat);
			expect(notes[0]!.endBeat - notes[0]!.startBeat).toBe(notes[1]!.endBeat - notes[1]!.startBeat);
		});
		it("returns empty for empty child", () => {
			expect(collectNotes(harmonize(sequence(), 4))).toEqual([]);
		});
	});
	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = harmonize(sequence(N.C4(2)), 3);
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});
	});
	describe("instanceof", () => {
		it("is a HarmonizePattern", () => {
			expect(harmonize(sequence(N.C4(1)), 7)).toBeInstanceOf(HarmonizePattern);
		});
	});
});
