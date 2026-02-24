import { describe, expect, it } from "vitest";
import { layer } from "../layer";
import { note } from "../note";
import { InvertPattern, invertChord } from "./invert";

describe("InvertPattern", () => {
	describe("notes", () => {
		it("moves lowest note up an octave for n=1", () => {
			// C4=60, E4=64, G4=67 → first inversion: E4@64, G4@67, C5@72
			const chord = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat = invertChord(chord, 1);
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			expect(pitches).toEqual([64, 67, 72]);
		});

		it("moves two lowest notes up an octave for n=2", () => {
			const chord = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat = invertChord(chord, 2);
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			expect(pitches).toEqual([67, 72, 76]);
		});

		it("moves highest note down an octave for n=-1", () => {
			// C4=60, E4=64, G4=67 → G3=55, C4=60, E4=64
			const chord = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat = invertChord(chord, -1);
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			expect(pitches).toEqual([55, 60, 64]);
		});

		it("returns unchanged notes for n=0", () => {
			const chord = layer(note("C4", "4n"), note("E4", "4n"));
			const pat = invertChord(chord, 0);
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			expect(pitches).toEqual([60, 64]);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(invertChord(note("C4", "2n"), 1).durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is an InvertPattern", () => {
			expect(invertChord(note("C4", "4n"), 1)).toBeInstanceOf(InvertPattern);
		});
	});
});
