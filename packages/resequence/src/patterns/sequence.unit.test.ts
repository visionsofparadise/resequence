import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { gap } from "./gap";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("SequencePattern", () => {
	describe("durationBeats", () => {
		it("sums child durations", () => {
			const pat = sequence(N.C4(1), N.E4(0.5));
			expect(pat.endBeat - pat.startBeat).toBe(1.5);
		});

		it("returns 0 for empty sequence", () => {
			expect(sequence().endBeat - sequence().startBeat).toBe(0);
		});
	});

	describe("notes", () => {
		it("accumulates offsets", () => {
			const pat = sequence(N.C4(1), N.D4(1), N.E4(1));
			const notes = collectNotes(pat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: N.C4 },
				{ startBeat: 1, pitch: N.D4 },
				{ startBeat: 2, pitch: N.E4 },
			]);
		});

		it("skips gaps", () => {
			const pat = sequence(N.C4(1), gap(1), N.E4(1));
			const notes = collectNotes(pat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: N.C4 },
				{ startBeat: 2, pitch: N.E4 },
			]);
		});

		it("returns empty for empty sequence", () => {
			expect(collectNotes(sequence())).toEqual([]);
		});
	});
});
