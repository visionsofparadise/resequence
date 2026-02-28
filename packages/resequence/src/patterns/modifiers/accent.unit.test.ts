import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { AccentPattern, accent } from "./accent";

describe("AccentPattern", () => {
	describe("notes", () => {
		it("boosts velocity of notes at accented positions", () => {
			// positions=[2] → cycle=2 beats, accentedBeats = {0, 2, ...}
			// C4@0 accented, E4@1 not accented
			const pat = accent(
				sequence(note(resolvePitch("C4"), resolveDuration("4n"), { velocity: 80 }), note(resolvePitch("E4"), resolveDuration("4n"), { velocity: 80 })),
				[2],
				20,
			);
			const notes = collectNotes(pat);
			expect(notes[0]!.velocity).toBe(100); // 80 + 20
			expect(notes[1]!.velocity).toBe(80); // unchanged
		});

		it("clamps velocity to 127", () => {
			// positions=[1] → cycle=1 beat, accentedBeats = {0, 1, 2, ...}
			const pat = accent(sequence(note(resolvePitch("C4"), resolveDuration("4n"), { velocity: 120 })), [1], 20);
			expect(collectNotes(pat)[0]!.velocity).toBe(127); // min(127, 120+20)
		});

		it("accents notes using default velocity of 100 when none set", () => {
			const pat = accent(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), [1], 10);
			expect(collectNotes(pat)[0]!.velocity).toBe(110); // (undefined ?? 100) + 10
		});

		it("repeats the accent cycle", () => {
			// four quarter notes, positions=[1, 1] → cycle=2 beats, accents at 0 and 1 per cycle
			// all four notes at 0, 1, 2, 3 — all accented
			const pat = accent(
				sequence(
					note(resolvePitch("C4"), resolveDuration("4n"), { velocity: 80 }),
					note(resolvePitch("D4"), resolveDuration("4n"), { velocity: 80 }),
					note(resolvePitch("E4"), resolveDuration("4n"), { velocity: 80 }),
					note(resolvePitch("F4"), resolveDuration("4n"), { velocity: 80 }),
				),
				[1, 1],
				20,
			);
			for (const positionedNote of collectNotes(pat)) {
				expect(positionedNote.velocity).toBe(100); // all accented
			}
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = accent(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), [1], 10);
			expect(pat.endBeat - pat.startBeat).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is an AccentPattern", () => {
			expect(accent(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), [1], 10)).toBeInstanceOf(AccentPattern);
		});
	});
});
