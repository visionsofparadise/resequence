import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { gap } from "../gap";
import { note } from "../note";
import { sequence } from "../sequence";
import { HealPattern, heal } from "./heal";

describe("HealPattern", () => {
	describe("notes", () => {
		it("merges consecutive same-pitch notes with zero gap", () => {
			const pat = heal(sequence(note("C4", "4n"), note("C4", "4n")));
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]).toMatchObject({ beat: 0, pitch: resolvePitch("C4"), durationBeats: 2 });
		});

		it("does not merge notes with different pitch", () => {
			const pat = heal(sequence(note("C4", "4n"), note("E4", "4n")));
			expect(pat.notes).toHaveLength(2);
		});

		it("merges when gap is within threshold", () => {
			const pat = heal(sequence(note("C4", 400), gap(80), note("C4", "4n")), 100);
			expect(pat.notes).toHaveLength(1);
		});

		it("does not merge when gap exceeds threshold", () => {
			const pat = heal(sequence(note("C4", 400), gap(80), note("C4", "4n")), 50);
			expect(pat.notes).toHaveLength(2);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(heal(sequence(note("C4", "4n"), note("C4", "4n"))).durationBeats).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a HealPattern", () => {
			expect(heal(note("C4", "4n"))).toBeInstanceOf(HealPattern);
		});
	});
});
