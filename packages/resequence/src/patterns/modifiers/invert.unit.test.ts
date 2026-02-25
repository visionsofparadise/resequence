import { describe, expect, it } from "vitest";
import { pitchKey, pitchToMidi } from "../../utils/pitch";
import { layer } from "../layer";
import { note } from "../note";
import { InvertPattern, invertChord } from "./invert";

describe("InvertPattern", () => {
	describe("notes", () => {
		it("moves lowest note up an octave for n=1", () => {
			// C4=60, E4=64, G4=67 → first inversion: E4@64, G4@67, C5@72
			const chord = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat = invertChord(chord, 1);
			const midiNotes = pat.notes.map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			expect(midiNotes).toEqual([64, 67, 72]);
		});

		it("moves two lowest notes up an octave for n=2", () => {
			const chord = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat = invertChord(chord, 2);
			const midiNotes = pat.notes.map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			expect(midiNotes).toEqual([67, 72, 76]);
		});

		it("moves highest note down an octave for n=-1", () => {
			// C4=60, E4=64, G4=67 → G3=55, C4=60, E4=64
			const chord = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat = invertChord(chord, -1);
			const midiNotes = pat.notes.map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			expect(midiNotes).toEqual([55, 60, 64]);
		});

		it("returns unchanged notes for n=0", () => {
			const chord = layer(note("C4", "4n"), note("E4", "4n"));
			const pat = invertChord(chord, 0);
			const sortedKeys = pat.notes.map((positionedNote) => pitchKey(positionedNote.pitch)).sort((a, b) => a - b);
			const expectedKeys = [note("C4", "4n").notes[0]!.pitch, note("E4", "4n").notes[0]!.pitch]
				.map(pitchKey)
				.sort((a, b) => a - b);
			expect(sortedKeys).toEqual(expectedKeys);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(invertChord(note("C4", "2n"), 1).durationBeats).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is an InvertPattern", () => {
			expect(invertChord(note("C4", "4n"), 1)).toBeInstanceOf(InvertPattern);
		});
	});
});
