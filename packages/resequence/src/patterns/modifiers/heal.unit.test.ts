import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { HealPattern, heal } from "./heal";

describe("HealPattern", () => {
	describe("notes", () => {
		it("merges consecutive same-pitch notes with zero gap", () => {
			const pat = heal(sequence(N.C4(1), N.C4(1)));
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(1);
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: N.C4, endBeat: 2 });
		});

		it("does not merge notes with different pitch", () => {
			const pat = heal(sequence(N.C4(1), N.E4(1)));
			expect(collectNotes(pat)).toHaveLength(2);
		});

		it("merges when gap is within threshold", () => {
			const pat = heal(sequence(N.C4(400), gap(80), N.C4(1)), 100);
			expect(collectNotes(pat)).toHaveLength(1);
		});

		it("does not merge when gap exceeds threshold", () => {
			const pat = heal(sequence(N.C4(400), gap(80), N.C4(1)), 50);
			expect(collectNotes(pat)).toHaveLength(2);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = heal(sequence(N.C4(1), N.C4(1)));
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a HealPattern", () => {
			expect(heal(sequence(N.C4(1)))).toBeInstanceOf(HealPattern);
		});
	});
});
