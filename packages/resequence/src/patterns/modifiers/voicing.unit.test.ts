import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchToMidi } from "../../utils/pitch";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { voicing } from "./voicing";

function cmaj7(): ReturnType<typeof layer> {
	return layer(sequence(N.C4(4)), sequence(N.E4(4)), sequence(N.G4(4)), sequence(N.B4(4)));
}

describe("VoicingPattern", () => {
	it("packs all notes within one octave above the lowest (close)", () => {
		const pat = voicing(cmaj7(), "close");
		const midiNotes = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
		const lowest = midiNotes[0]!;
		expect(midiNotes.every((midi) => midi >= lowest && midi <= lowest + 12)).toBe(true);
	});

	it("moves second-from-top note down an octave (drop2)", () => {
		const closePat = voicing(cmaj7(), "close");
		const drop2Pat = voicing(cmaj7(), "drop2");
		const closeMidi = collectNotes(closePat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
		const drop2Midi = collectNotes(drop2Pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
		expect(drop2Midi[0]).toBeLessThan(closeMidi[0]!);
	});
});
