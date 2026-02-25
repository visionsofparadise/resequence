import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { HarmonizePattern, harmonize } from "./harmonize";

describe("HarmonizePattern", () => {
	describe("notes", () => {
		it("doubles each note at the parallel interval", () => {
			const pat = harmonize(note("C4", "4n"), 7);
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4") },
				{ beat: 0, pitch: resolvePitch("G4") },
			]);
		});

		it("produces 2x the original note count", () => {
			const pat = harmonize(sequence(note("C4", "8n"), note("E4", "8n")), 4);
			expect(pat.notes).toHaveLength(4);
		});

		it("each pair shares the same tick and duration", () => {
			const pat = harmonize(note("C4", "4n"), 5);
			expect(pat.notes[0]?.beat).toBe(pat.notes[1]?.beat);
			expect(pat.notes[0]?.durationBeats).toBe(pat.notes[1]?.durationBeats);
		});

		it("returns empty for empty child", () => {
			expect(harmonize(sequence(), 4).notes).toEqual([]);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(harmonize(note("C4", "2n"), 3).durationBeats).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a HarmonizePattern", () => {
			expect(harmonize(note("C4", "4n"), 7)).toBeInstanceOf(HarmonizePattern);
		});
	});
});
