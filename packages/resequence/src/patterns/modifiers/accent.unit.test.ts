import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { AccentPattern, accent } from "./accent";

describe("AccentPattern", () => {
	describe("notes", () => {
		it("boosts velocity of notes at accented positions", () => {
			// positions=[960] → accent every 960 ticks → accentedTicks = {0, 960, ...}
			// C4@0 accented, E4@480 not accented
			const pat = accent(
				sequence(note("C4", "4n", { velocity: 80 }), note("E4", "4n", { velocity: 80 })),
				[960],
				20,
			);
			expect(pat.notes[0]!.velocity).toBe(100); // 80 + 20
			expect(pat.notes[1]!.velocity).toBe(80); // unchanged
		});

		it("clamps velocity to 127", () => {
			// positions=[480] → cycle=480, accentedTicks = {0, 480, 960, ...}
			const pat = accent(note("C4", "4n", { velocity: 120 }), [480], 20);
			expect(pat.notes[0]!.velocity).toBe(127); // min(127, 120+20)
		});

		it("accents notes using default velocity of 100 when none set", () => {
			const pat = accent(note("C4", "4n"), [480], 10);
			expect(pat.notes[0]!.velocity).toBe(110); // (undefined ?? 100) + 10
		});

		it("repeats the accent cycle", () => {
			// four quarter notes, positions=[480, 480] → cycle=960, accents at 0 and 480 per cycle
			// all four notes at 0, 480, 960, 1440 — all accented
			const pat = accent(
				sequence(
					note("C4", "4n", { velocity: 80 }),
					note("D4", "4n", { velocity: 80 }),
					note("E4", "4n", { velocity: 80 }),
					note("F4", "4n", { velocity: 80 }),
				),
				[480, 480],
				20,
			);
			for (const positionedNote of pat.notes) {
				expect(positionedNote.velocity).toBe(100); // all accented
			}
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(accent(note("C4", "4n"), [480], 10).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is an AccentPattern", () => {
			expect(accent(note("C4", "4n"), [480], 10)).toBeInstanceOf(AccentPattern);
		});
	});
});
