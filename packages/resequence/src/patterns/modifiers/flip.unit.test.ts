import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { pitchToMidi, resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { FlipPattern, flip } from "./flip";

describe("FlipPattern", () => {
	describe("notes", () => {
		it("inverts pitch around center", () => {
			// C4=60, center=60: newPitch = 60 (unison)
			// E4=64, center=60: newPitch = 56 (Ab3)
			const pat = flip(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), "C4");
			const notes = collectNotes(pat);
			expect(notes[0]?.pitch).toEqual(resolvePitch("C4"));
			expect(notes[1]?.pitch).toEqual(resolvePitch(56)); // Ab3
		});

		it("accepts numeric center", () => {
			const pat = flip(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 60);
			expect(collectNotes(pat)[0]?.pitch).toEqual(resolvePitch("C4"));
		});

		it("octave-shifts to stay within range", () => {
			// E4=64, center=60 → flipped=56: within [C3,C5], stays at 56
			const pat = flip(sequence(note(resolvePitch("E4"), resolveDuration("4n"))), "C4", ["C3", "C5"]);
			expect(pitchToMidi(collectNotes(pat)[0]!.pitch).note).toBeGreaterThanOrEqual(48);
			expect(pitchToMidi(collectNotes(pat)[0]!.pitch).note).toBeLessThanOrEqual(72);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = flip(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), "C4");
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a FlipPattern", () => {
			expect(flip(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "C4")).toBeInstanceOf(FlipPattern);
		});
	});
});
