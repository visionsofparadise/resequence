import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchKey, pitchToMidi } from "../../utils/pitch";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { InvertPattern, invertChord } from "./invert";

describe("InvertPattern", () => {
	describe("notes", () => {
		it("moves lowest note up an octave for n=1", () => {
			// C4=60, E4=64, G4=67 → first inversion: E4@64, G4@67, C5@72
			const chord = layer(sequence(N.C4(1)), sequence(N.E4(1)), sequence(N.G4(1)));
			const pat = invertChord(chord, 1);
			const midiNotes = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			expect(midiNotes).toEqual([64, 67, 72]);
		});

		it("moves two lowest notes up an octave for n=2", () => {
			const chord = layer(sequence(N.C4(1)), sequence(N.E4(1)), sequence(N.G4(1)));
			const pat = invertChord(chord, 2);
			const midiNotes = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			expect(midiNotes).toEqual([67, 72, 76]);
		});

		it("moves highest note down an octave for n=-1", () => {
			// C4=60, E4=64, G4=67 → G3=55, C4=60, E4=64
			const chord = layer(sequence(N.C4(1)), sequence(N.E4(1)), sequence(N.G4(1)));
			const pat = invertChord(chord, -1);
			const midiNotes = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			expect(midiNotes).toEqual([55, 60, 64]);
		});

		it("returns unchanged notes for n=0", () => {
			const chord = layer(sequence(N.C4(1)), sequence(N.E4(1)));
			const pat = invertChord(chord, 0);
			const sortedKeys = collectNotes(pat).map((positionedNote) => pitchKey(positionedNote.pitch)).sort((a, b) => a - b);
			const expectedKeys = [N.C4, N.E4]
				.map(pitchKey)
				.sort((a, b) => a - b);
			expect(sortedKeys).toEqual(expectedKeys);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(invertChord(sequence(N.C4(2)), 1).endBeat - invertChord(sequence(N.C4(2)), 1).startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is an InvertPattern", () => {
			expect(invertChord(sequence(N.C4(1)), 1)).toBeInstanceOf(InvertPattern);
		});
	});
});
