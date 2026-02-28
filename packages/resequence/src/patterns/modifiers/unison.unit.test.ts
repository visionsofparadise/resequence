import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { pitchKey } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { UnisonPattern, unison } from "./unison";

describe("UnisonPattern", () => {
	describe("notes", () => {
		it("creates the specified number of voice copies", () => {
			const pat = unison(sequence(N.C4(1)), 3);
			expect(collectNotes(pat)).toHaveLength(3);
		});
		it("centers voices around original pitch with pitch spread", () => {
			// 3 voices, spread pitch 12: offsets = -12, 0, +12
			const pat = unison(sequence(N.C4(1)), 3, { pitch: 12 });
			const notes = collectNotes(pat);
			expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C3)); // C4 - 12 semitones
			expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.C4)); // C4 + 0
			expect(pitchKey(notes[2]!.pitch)).toBe(pitchKey(N.C5)); // C4 + 12 semitones
		});
		it("all voices share the same pitch when no spread is given", () => {
			const pat = unison(sequence(N.C4(1)), 3);
			for (const positionedNote of collectNotes(pat)) {
				expect(pitchKey(positionedNote.pitch)).toBe(pitchKey(N.C4));
			}
		});
		it("applies CC spread symmetrically across voices", () => {
			// 3 voices, cc spread {1: 10}: base=64, offsets = -10, 0, +10
			const pat = unison(sequence(N.C4(1)), 3, { cc: { 1: 10 } });
			const notes = collectNotes(pat);
			expect(notes[0]!.cc?.[1]).toBe(54); // 64 - 10
			expect(notes[1]!.cc?.[1]).toBe(64); // 64 + 0
			expect(notes[2]!.cc?.[1]).toBe(74); // 64 + 10
		});
		it("preserves beat and durationBeats on all voices", () => {
			const pat = unison(sequence(N.C4(1)), 2, { pitch: 12 });
			for (const positionedNote of collectNotes(pat)) {
				expect(positionedNote.startBeat).toBe(0);
				expect(positionedNote.endBeat - positionedNote.startBeat).toBe(1);
			}
		});
	});
	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(unison(sequence(N.C4(1)), 3).endBeat - unison(sequence(N.C4(1)), 3).startBeat).toBe(1);
		});
	});
	describe("instanceof", () => {
		it("is a UnisonPattern", () => {
			expect(unison(sequence(N.C4(1)), 3)).toBeInstanceOf(UnisonPattern);
		});
	});
});
