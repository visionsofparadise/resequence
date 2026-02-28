import { describe, expect, it } from "vitest";
import { ResequenceError } from "../../error";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { repeat } from "./repeat";

describe("RepeatPattern", () => {
	describe("validation", () => {
		it("rejects count less than 1", () => {
			expect(() => repeat(sequence(N.C4(1)), 0)).toThrow(ResequenceError);
			expect(() => repeat(sequence(N.C4(1)), 0)).toThrow("count must be a positive integer");
		});

		it("rejects negative count", () => {
			expect(() => repeat(sequence(N.C4(1)), -2)).toThrow(ResequenceError);
		});

		it("rejects non-integer count", () => {
			expect(() => repeat(sequence(N.C4(1)), 2.5)).toThrow(ResequenceError);
			expect(() => repeat(sequence(N.C4(1)), 2.5)).toThrow("count must be a positive integer");
		});

		it("accepts count of 1", () => {
			expect(repeat(sequence(N.C4(1)), 1).endBeat - repeat(sequence(N.C4(1)), 1).startBeat).toBe(1);
		});
	});

	describe("durationBeats", () => {
		it("multiplies child duration by count", () => {
			expect(repeat(sequence(N.C4(1)), 4).endBeat - repeat(sequence(N.C4(1)), 4).startBeat).toBe(4);
		});
	});

	describe("notes", () => {
		it("multiplies offsets", () => {
			const pat = repeat(sequence(N.C4(1)), 4);
			expect(collectNotes(pat)).toMatchObject([
				{ startBeat: 0, pitch: N.C4 },
				{ startBeat: 1, pitch: N.C4 },
				{ startBeat: 2, pitch: N.C4 },
				{ startBeat: 3, pitch: N.C4 },
			]);
		});

		it("handles repeat of a sequence", () => {
			const pat = repeat(sequence(N.C4(0.5), N.E4(0.5)), 2);
			const notes = collectNotes(pat).slice().sort((a, b) => a.startBeat - b.startBeat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: N.C4 },
				{ startBeat: 0.5, pitch: N.E4 },
				{ startBeat: 1, pitch: N.C4 },
				{ startBeat: 1.5, pitch: N.E4 },
			]);
		});
	});
});
