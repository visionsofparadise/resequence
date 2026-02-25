import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { UnisonPattern, unison } from "./unison";

describe("UnisonPattern", () => {
	describe("notes", () => {
		it("creates the specified number of voice copies", () => {
			const pat = unison(note("C4", "4n"), 3);
			expect(pat.notes).toHaveLength(3);
		});

		it("centers voices around original pitch with pitch spread", () => {
			// 3 voices, spread pitch 12: offsets = -12, 0, +12
			const pat = unison(note("C4", "4n"), 3, { pitch: 12 });
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("C3")); // C4 - 12 semitones
			expect(pat.notes[1]!.pitch).toEqual(resolvePitch("C4")); // C4 + 0
			expect(pat.notes[2]!.pitch).toEqual(resolvePitch("C5")); // C4 + 12 semitones
		});

		it("all voices share the same pitch when no spread is given", () => {
			const pat = unison(note("C4", "4n"), 3);
			for (const positionedNote of pat.notes) {
				expect(positionedNote.pitch).toEqual(resolvePitch("C4"));
			}
		});

		it("applies CC spread symmetrically across voices", () => {
			// 3 voices, cc spread {1: 10}: base=64, offsets = -10, 0, +10
			const pat = unison(note("C4", "4n"), 3, { cc: { 1: 10 } });
			expect(pat.notes[0]!.cc?.[1]).toBe(54); // 64 - 10
			expect(pat.notes[1]!.cc?.[1]).toBe(64); // 64 + 0
			expect(pat.notes[2]!.cc?.[1]).toBe(74); // 64 + 10
		});

		it("preserves beat and durationBeats on all voices", () => {
			const pat = unison(note("C4", "4n"), 2, { pitch: 12 });
			for (const positionedNote of pat.notes) {
				expect(positionedNote.beat).toBe(0);
				expect(positionedNote.durationBeats).toBe(1);
			}
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(unison(note("C4", "4n"), 3).durationBeats).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a UnisonPattern", () => {
			expect(unison(note("C4", "4n"), 3)).toBeInstanceOf(UnisonPattern);
		});
	});
});
