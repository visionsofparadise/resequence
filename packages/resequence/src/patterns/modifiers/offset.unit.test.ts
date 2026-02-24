import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { OffsetPattern, offset } from "./offset";

describe("OffsetPattern", () => {
	describe("notes", () => {
		it("shifts all tick positions by positive amount", () => {
			const pat = offset(sequence(note("C4", "4n"), note("E4", "4n")), 120);
			expect(pat.notes).toMatchObject([
				{ tick: 120, pitch: 60 },
				{ tick: 600, pitch: 64 },
			]);
		});

		it("shifts by negative amount", () => {
			const pat = offset(sequence(note("C4", "4n"), note("E4", "4n")), -120);
			expect(pat.notes[1]?.tick).toBe(360);
		});

		it("clamps negative-shifted notes to tick 0", () => {
			const pat = offset(note("C4", "4n"), -960);
			expect(pat.notes[0]?.tick).toBe(0);
		});

		it("accepts Duration string", () => {
			const pat = offset(note("C4", "4n"), "8n");
			expect(pat.notes[0]?.tick).toBe(240);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(offset(note("C4", "2n"), 120).durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is an OffsetPattern", () => {
			expect(offset(note("C4", "4n"), 0)).toBeInstanceOf(OffsetPattern);
		});
	});
});
