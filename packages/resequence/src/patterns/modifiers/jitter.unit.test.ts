import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { JitterPattern, jitter } from "./jitter";

describe("JitterPattern", () => {
	describe("notes", () => {
		it("produces same output every run with a seed", () => {
			const src = sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat1 = jitter(src, 60, 42);
			const pat2 = jitter(src, 60, 42);
			expect(pat1.notes.map((positionedNote) => positionedNote.tick)).toEqual(
				pat2.notes.map((positionedNote) => positionedNote.tick),
			);
		});

		it("produces different output with different seeds", () => {
			const src = sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			const pat1 = jitter(src, 60, 1);
			const pat2 = jitter(src, 60, 2);
			const ticks1 = pat1.notes.map((positionedNote) => positionedNote.tick);
			const ticks2 = pat2.notes.map((positionedNote) => positionedNote.tick);
			expect(ticks1).not.toEqual(ticks2);
		});

		it("clamps tick positions to minimum 0", () => {
			const pat = jitter(note("C4", "4n"), 1000, 1);
			expect(pat.notes[0]?.tick).toBeGreaterThanOrEqual(0);
		});

		it("accepts Duration string amount", () => {
			const pat = jitter(note("C4", "4n"), "8n", 1);
			expect(pat.notes).toHaveLength(1);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(jitter(note("C4", "2n"), 30, 1).durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is a JitterPattern", () => {
			expect(jitter(note("C4", "4n"), 10)).toBeInstanceOf(JitterPattern);
		});
	});
});
