import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { AccentPattern, accent } from "./accent";

describe("AccentPattern", () => {
	describe("notes", () => {
		it("boosts velocity of notes at accented positions", () => {
			// positions=[2] → cycle=2 beats, accentedBeats = {0, 2, ...}
			// C4@0 accented, E4@1 not accented
			const pat = accent(
				sequence(note("C4", "4n", { velocity: 80 }), note("E4", "4n", { velocity: 80 })),
				[2],
				20,
			);
			expect(pat.notes[0]!.velocity).toBe(100); // 80 + 20
			expect(pat.notes[1]!.velocity).toBe(80); // unchanged
		});

		it("clamps velocity to 127", () => {
			// positions=[1] → cycle=1 beat, accentedBeats = {0, 1, 2, ...}
			const pat = accent(note("C4", "4n", { velocity: 120 }), [1], 20);
			expect(pat.notes[0]!.velocity).toBe(127); // min(127, 120+20)
		});

		it("accents notes using default velocity of 100 when none set", () => {
			const pat = accent(note("C4", "4n"), [1], 10);
			expect(pat.notes[0]!.velocity).toBe(110); // (undefined ?? 100) + 10
		});

		it("repeats the accent cycle", () => {
			// four quarter notes, positions=[1, 1] → cycle=2 beats, accents at 0 and 1 per cycle
			// all four notes at 0, 1, 2, 3 — all accented
			const pat = accent(
				sequence(
					note("C4", "4n", { velocity: 80 }),
					note("D4", "4n", { velocity: 80 }),
					note("E4", "4n", { velocity: 80 }),
					note("F4", "4n", { velocity: 80 }),
				),
				[1, 1],
				20,
			);
			for (const positionedNote of pat.notes) {
				expect(positionedNote.velocity).toBe(100); // all accented
			}
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(accent(note("C4", "4n"), [1], 10).durationBeats).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is an AccentPattern", () => {
			expect(accent(note("C4", "4n"), [1], 10)).toBeInstanceOf(AccentPattern);
		});
	});
});
