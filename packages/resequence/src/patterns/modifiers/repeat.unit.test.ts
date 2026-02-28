import { describe, expect, it } from "vitest";
import { ResequenceError } from "../../error";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { repeat } from "./repeat";

describe("RepeatPattern", () => {
	describe("validation", () => {
		it("rejects count less than 1", () => {
			expect(() => repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 0)).toThrow(ResequenceError);
			expect(() => repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 0)).toThrow("count must be a positive integer");
		});

		it("rejects negative count", () => {
			expect(() => repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), -2)).toThrow(ResequenceError);
		});

		it("rejects non-integer count", () => {
			expect(() => repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 2.5)).toThrow(ResequenceError);
			expect(() => repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 2.5)).toThrow("count must be a positive integer");
		});

		it("accepts count of 1", () => {
			expect(repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 1).endBeat - repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 1).startBeat).toBe(1);
		});
	});

	describe("durationBeats", () => {
		it("multiplies child duration by count", () => {
			expect(repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 4).endBeat - repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 4).startBeat).toBe(4);
		});
	});

	describe("notes", () => {
		it("multiplies offsets", () => {
			const pat = repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 4);
			expect(collectNotes(pat)).toMatchObject([
				{ startBeat: 0, pitch: resolvePitch("C4") },
				{ startBeat: 1, pitch: resolvePitch("C4") },
				{ startBeat: 2, pitch: resolvePitch("C4") },
				{ startBeat: 3, pitch: resolvePitch("C4") },
			]);
		});

		it("handles repeat of a sequence", () => {
			const pat = repeat(sequence(note(resolvePitch("C4"), resolveDuration("8n")), note(resolvePitch("E4"), resolveDuration("8n"))), 2);
			const notes = collectNotes(pat).slice().sort((a, b) => a.startBeat - b.startBeat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: resolvePitch("C4") },
				{ startBeat: 0.5, pitch: resolvePitch("E4") },
				{ startBeat: 1, pitch: resolvePitch("C4") },
				{ startBeat: 1.5, pitch: resolvePitch("E4") },
			]);
		});
	});
});
