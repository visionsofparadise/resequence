import { describe, expect, it } from "vitest";
import { gap } from "./gap";
import { note } from "./note";
import { sequence } from "./sequence";

describe("SequencePattern", () => {
	describe("durationTicks", () => {
		it("sums child durations", () => {
			expect(sequence(note("C4", "4n"), note("E4", "8n")).durationTicks).toBe(720);
		});

		it("returns 0 for empty sequence", () => {
			expect(sequence().durationTicks).toBe(0);
		});
	});

	describe("notes", () => {
		it("accumulates offsets", () => {
			const pat = sequence(note("C4", "4n"), note("D4", "4n"), note("E4", "4n"));
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 60 },
				{ tick: 480, pitch: 62 },
				{ tick: 960, pitch: 64 },
			]);
		});

		it("skips gaps", () => {
			const pat = sequence(note("C4", "4n"), gap("4n"), note("E4", "4n"));
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 60 },
				{ tick: 960, pitch: 64 },
			]);
		});

		it("returns empty for empty sequence", () => {
			expect(sequence().notes).toEqual([]);
		});
	});
});
