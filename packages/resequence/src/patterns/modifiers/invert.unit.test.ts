import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchToMidi } from "../../utils/pitch";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { invertChord } from "./invert";

describe("invertChord", () => {
	it("moves lowest note up an octave for n=1", () => {
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
		const chord = layer(sequence(N.C4(1)), sequence(N.E4(1)), sequence(N.G4(1)));
		const pat = invertChord(chord, -1);
		const midiNotes = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
		expect(midiNotes).toEqual([55, 60, 64]);
	});
});
