import { describe, expect, it } from "vitest";
import { gap } from "../gap";
import { layer } from "../layer";
import { note } from "../note";
import { sequence } from "../sequence";
import { PolyphonyPattern, polyphony } from "./polyphony";

describe("PolyphonyPattern", () => {
	describe("notes", () => {
		it("allows notes up to the max simultaneously", () => {
			const pat = polyphony(layer(note("C4", "4n"), note("E4", "4n")), 2);
			expect(pat.notes).toHaveLength(2);
		});

		it("drops notes exceeding max in non-greedy mode", () => {
			// Two notes at tick 0, max 1 → second is dropped
			const pat = polyphony(layer(note("C4", "4n"), note("E4", "4n")), 1);
			expect(pat.notes).toHaveLength(1);
		});

		it("in greedy mode replaces oldest active note with incoming note", () => {
			// Both notes at tick 0, max 1, greedy → second replaces first
			const pat = polyphony(layer(note("C4", "4n"), note("E4", "4n")), 1, true);
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]!.pitch).toBe(64); // E4 won (replaced C4)
		});

		it("does not drop notes that do not overlap in time", () => {
			// C4@0 dur 240, gap 240, E4@480 dur 480 — no overlap, both fit in max 1
			const pat = polyphony(sequence(note("C4", 240), gap(240), note("E4", "4n")), 1);
			expect(pat.notes).toHaveLength(2);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(polyphony(note("C4", "4n"), 4).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is a PolyphonyPattern", () => {
			expect(polyphony(note("C4", "4n"), 4)).toBeInstanceOf(PolyphonyPattern);
		});
	});
});
