import { describe, expect, it } from "vitest";
import { resolvePitch } from "../utils/pitch";
import { gap } from "./gap";
import { note } from "./note";
import { sequence } from "./sequence";

describe("SequencePattern", () => {
	describe("durationBeats", () => {
		it("sums child durations", () => {
			expect(sequence(note("C4", "4n"), note("E4", "8n")).durationBeats).toBe(1.5);
		});

		it("returns 0 for empty sequence", () => {
			expect(sequence().durationBeats).toBe(0);
		});
	});

	describe("notes", () => {
		it("accumulates offsets", () => {
			const pat = sequence(note("C4", "4n"), note("D4", "4n"), note("E4", "4n"));
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4") },
				{ beat: 1, pitch: resolvePitch("D4") },
				{ beat: 2, pitch: resolvePitch("E4") },
			]);
		});

		it("skips gaps", () => {
			const pat = sequence(note("C4", "4n"), gap("4n"), note("E4", "4n"));
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4") },
				{ beat: 2, pitch: resolvePitch("E4") },
			]);
		});

		it("returns empty for empty sequence", () => {
			expect(sequence().notes).toEqual([]);
		});
	});
});
