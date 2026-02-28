import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { SlidePattern, slide } from "./slide";

const C4 = N.C4;
const E4 = N.E4;
const G4 = N.G4;

describe("SlidePattern", () => {
	describe("notes", () => {
		it("adds slide keyframes when notes overlap", () => {
			// A: C4 at beat 0, dur 1.5 — B: E4 at beat 1.0, dur 1.0
			// Overlap: beat 1.0 to 1.5
			const pat = slide(layer(sequence(N.C4(1.5)), sequence(gap(1), N.E4(1))));

			const noteA = collectNotes(pat).find((sn) => sn.startBeat === 0 && sn.pitch.class === C4.class);
			expect(noteA).toBeDefined();
			expect(noteA!.slides).toBeDefined();
			expect(noteA!.slides).toHaveLength(2);
			// Hold at beat 1.0 with C4's pitch
			expect(noteA!.slides![0]).toEqual({ beat: 1.0, pitch: C4, curve: 0 });
			// Target at beat 1.5 with E4's pitch
			expect(noteA!.slides![1]).toEqual({ beat: 1.5, pitch: E4, curve: 0 });
		});

		it("does not add slides for adjacent notes (no overlap)", () => {
			// A: C4 dur 1.0, B: E4 dur 1.0 — adjacent, not overlapping
			const pat = slide(sequence(N.C4(1), N.E4(1)));

			for (const sn of collectNotes(pat)) {
				expect(sn.slides).toBeUndefined();
			}
		});

		it("handles chained slides across three overlapping notes", () => {
			// A: C4 at 0, dur 1.5 — B: E4 at 1.0, dur 1.5 — C: G4 at 2.0, dur 1.0
			const pat = slide(
				layer(sequence(N.C4(1.5)), sequence(gap(1), N.E4(1.5)), sequence(gap(2), N.G4(1))),
			);

			// A should slide to B
			const noteA = collectNotes(pat).find((sn) => sn.startBeat === 0);
			expect(noteA!.slides).toBeDefined();
			expect(noteA!.slides![1]).toMatchObject({ pitch: E4 });

			// B should slide to C
			const noteB = collectNotes(pat).find((sn) => sn.startBeat === 1.0 && sn.pitch.class === E4.class);
			expect(noteB!.slides).toBeDefined();
			expect(noteB!.slides![1]).toMatchObject({ pitch: G4 });
		});

		it("matches by pitch proximity for polyphonic overlaps", () => {
			// A: C4 at 0, dur 2, B: G4 at 0, dur 2
			// C: E4 at 1, dur 1, D: A4 at 1, dur 1
			// C4 is closer to E4 (4 steps) than A4 (9 steps)
			// G4 is closer to A4 (2 steps) than E4 (3 steps)
			const A4 = N.A4;
			const pat = slide(
				layer(sequence(N.C4(2)), sequence(N.G4(2)), sequence(gap(1), N.E4(1)), sequence(gap(1), N.A4(1))),
			);

			const noteC4 = collectNotes(pat).find((sn) => sn.startBeat === 0 && sn.pitch.class === C4.class);
			expect(noteC4!.slides).toBeDefined();
			expect(noteC4!.slides![1]).toMatchObject({ pitch: E4 });

			const noteG4 = collectNotes(pat).find((sn) => sn.startBeat === 0 && sn.pitch.class === G4.class);
			expect(noteG4!.slides).toBeDefined();
			expect(noteG4!.slides![1]).toMatchObject({ pitch: A4 });
		});

		it("merges with existing user-defined slides", () => {
			const pat = slide(
				layer(
					sequence(N.C4(2, { slides: [{ pitch: N.D4, beat: 0.5 }] })),
					sequence(gap(1), N.G4(1)),
				),
			);

			const noteA = collectNotes(pat).find((sn) => sn.startBeat === 0);
			expect(noteA!.slides).toBeDefined();
			// Should have the user's slide at 0.5, plus hold at 1.0 and target at 2.0
			expect(noteA!.slides!.length).toBeGreaterThanOrEqual(3);
			expect(noteA!.slides![0]).toMatchObject({ beat: 0.5 });
		});

		it("returns notes unchanged for single note", () => {
			const pat = slide(sequence(N.C4(1)));
			expect(collectNotes(pat)).toHaveLength(1);
			expect(collectNotes(pat)[0]!.slides).toBeUndefined();
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const child = sequence(N.C4(1), N.E4(1));
			expect(slide(child).endBeat - slide(child).startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a SlidePattern", () => {
			expect(slide(sequence(N.C4(1)))).toBeInstanceOf(SlidePattern);
		});
	});
});
