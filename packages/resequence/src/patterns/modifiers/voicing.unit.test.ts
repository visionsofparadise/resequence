import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { pitchToMidi, resolvePitch } from "../../utils/pitch";
import { layer } from "../layer";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { VoicingPattern, voicing } from "./voicing";

// C4=60, E4=64, G4=67, B4=71
function cmaj7(): ReturnType<typeof layer> {
	return layer(sequence(note(resolvePitch("C4"), resolveDuration("1n"))), sequence(note(resolvePitch("E4"), resolveDuration("1n"))), sequence(note(resolvePitch("G4"), resolveDuration("1n"))), sequence(note(resolvePitch("B4"), resolveDuration("1n"))));
}

describe("VoicingPattern", () => {
	describe("close voicing", () => {
		it("packs all notes within one octave above the lowest", () => {
			const pat = voicing(cmaj7(), "close");
			const midiNotes = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			const lowest = midiNotes[0]!;
			expect(midiNotes.every((midi) => midi >= lowest && midi <= lowest + 12)).toBe(true);
		});
	});

	describe("drop2 voicing", () => {
		it("moves second-from-top note down an octave from close voicing", () => {
			const closePat = voicing(cmaj7(), "close");
			const drop2Pat = voicing(cmaj7(), "drop2");
			const closeMidi = collectNotes(closePat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			const drop2Midi = collectNotes(drop2Pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			// drop2 should have a lower minimum than close
			expect(drop2Midi[0]).toBeLessThan(closeMidi[0]!);
		});
	});

	describe("drop3 voicing", () => {
		it("moves third-from-top note down an octave from close voicing", () => {
			const closePat = voicing(cmaj7(), "close");
			const drop3Pat = voicing(cmaj7(), "drop3");
			const closeMidi = collectNotes(closePat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			const drop3Midi = collectNotes(drop3Pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			expect(drop3Midi[0]).toBeLessThan(closeMidi[0]!);
		});
	});

	describe("open voicing", () => {
		it("spreads notes beyond one octave", () => {
			const pat = voicing(cmaj7(), "open");
			const midiNotes = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note).sort((a, b) => a - b);
			const span = midiNotes[midiNotes.length - 1]! - midiNotes[0]!;
			expect(span).toBeGreaterThan(12);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(voicing(cmaj7(), "close").endBeat - voicing(cmaj7(), "close").startBeat).toBe(4);
		});
	});

	describe("instanceof", () => {
		it("is a VoicingPattern", () => {
			expect(voicing(cmaj7(), "close")).toBeInstanceOf(VoicingPattern);
		});
	});
});
