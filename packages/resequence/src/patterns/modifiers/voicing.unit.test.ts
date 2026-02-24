import { describe, expect, it } from "vitest";
import { layer } from "../layer";
import { note } from "../note";
import { VoicingPattern, voicing } from "./voicing";

// C4=60, E4=64, G4=67, B4=71
function cmaj7(): ReturnType<typeof layer> {
	return layer(note("C4", "1n"), note("E4", "1n"), note("G4", "1n"), note("B4", "1n"));
}

describe("VoicingPattern", () => {
	describe("close voicing", () => {
		it("packs all notes within one octave above the lowest", () => {
			const pat = voicing(cmaj7(), "close");
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			const lowest = pitches[0]!;
			expect(pitches.every((pitch) => pitch >= lowest && pitch <= lowest + 12)).toBe(true);
		});
	});

	describe("drop2 voicing", () => {
		it("moves second-from-top note down an octave from close voicing", () => {
			const closePat = voicing(cmaj7(), "close");
			const drop2Pat = voicing(cmaj7(), "drop2");
			const closePitches = closePat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			const drop2Pitches = drop2Pat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			// drop2 should have a lower minimum than close
			expect(drop2Pitches[0]).toBeLessThan(closePitches[0]!);
		});
	});

	describe("drop3 voicing", () => {
		it("moves third-from-top note down an octave from close voicing", () => {
			const closePat = voicing(cmaj7(), "close");
			const drop3Pat = voicing(cmaj7(), "drop3");
			const closePitches = closePat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			const drop3Pitches = drop3Pat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			expect(drop3Pitches[0]).toBeLessThan(closePitches[0]!);
		});
	});

	describe("open voicing", () => {
		it("spreads notes beyond one octave", () => {
			const pat = voicing(cmaj7(), "open");
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchA - pitchB);
			const span = pitches[pitches.length - 1]! - pitches[0]!;
			expect(span).toBeGreaterThan(12);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(voicing(cmaj7(), "close").durationTicks).toBe(1920);
		});
	});

	describe("instanceof", () => {
		it("is a VoicingPattern", () => {
			expect(voicing(cmaj7(), "close")).toBeInstanceOf(VoicingPattern);
		});
	});
});
