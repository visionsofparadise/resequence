import { describe, expect, it } from "vitest";
import { gap } from "../gap";
import { layer } from "../layer";
import { note } from "../note";
import { sequence } from "../sequence";
import { LegatoPattern, legato } from "./legato";

describe("LegatoPattern", () => {
	describe("notes", () => {
		it("extends note duration to reach the next note", () => {
			// C4@0 dur 100, gap 380, E4@480 dur 100 — C4 should extend to fill gap
			const pat = legato(sequence(note("C4", 100), gap(380), note("E4", 100)));
			expect(pat.notes[0]).toMatchObject({ tick: 0, durationTicks: 480 });
		});

		it("extends last note to fill remaining child durationTicks when extendLast is true", () => {
			// Single note with shorter duration than pattern space
			const pat = legato(layer(note("C4", 100), gap(380)));
			expect(pat.notes[0]).toMatchObject({ tick: 0, durationTicks: 380 });
		});

		it("preserves last note duration when extendLast is false", () => {
			const pat = legato(layer(note("C4", 100), gap(380)), false);
			expect(pat.notes[0]).toMatchObject({ tick: 0, durationTicks: 100 });
		});

		it("preserves pitch", () => {
			const pat = legato(sequence(note("C4", 100), gap(380), note("E4", 100)));
			expect(pat.notes[0]!.pitch).toBe(60);
			expect(pat.notes[1]!.pitch).toBe(64);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(legato(note("C4", "4n")).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is a LegatoPattern", () => {
			expect(legato(note("C4", "4n"))).toBeInstanceOf(LegatoPattern);
		});
	});
});
