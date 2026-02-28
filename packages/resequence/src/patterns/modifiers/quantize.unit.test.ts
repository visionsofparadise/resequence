import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { QuantizePattern, quantize, shuffle } from "./quantize";

describe("QuantizePattern", () => {
	describe("without groove map", () => {
		it("snaps notes to nearest subdivision grid", () => {
			// Notes at 0, 250, 490 with grid 480; first note already on beat 0
			const pat = quantize(sequence(N.C4(250), N.E4(240), N.G4(240)), 480);
			// First note at 0
			expect(collectNotes(pat)[0]?.startBeat).toBe(0);
		});

		it("snaps halfway point down to lower grid line", () => {
			// Note at beat 0.5, grid "4n" (1 beat) → exactly halfway; <= grid/2 snaps to 0
			const pat = quantize(
				sequence(gap(0.5), N.C4(1)),
				1,
			);
			expect(collectNotes(pat)[0]?.startBeat).toBe(0);
		});

		it("accepts Duration string subdivision", () => {
			const pat = quantize(sequence(N.C4(1)), 1);
			expect(collectNotes(pat)[0]?.startBeat).toBe(0);
		});

		it("returns instance of QuantizePattern", () => {
			expect(quantize(sequence(N.C4(1)), 1)).toBeInstanceOf(QuantizePattern);
		});
	});

	describe("with groove map", () => {
		it("snaps to grooved positions", () => {
			// "4n" grid (1 beat), groove positions at [0, 0.67] (swing 0.67)
			// Notes originally at [0, 1]
			// cycle 0: rem 0 → nearest [0, 0.67] = 0 → beat 0
			// cycle 1: rem 0 → nearest [0, 0.67] = 0 → beat 1
			const src = sequence(N.C4(1), N.E4(1));
			const pat = shuffle(src, 0.67);
			expect(collectNotes(pat)[0]?.startBeat).toBe(0);
			expect(collectNotes(pat)[1]?.startBeat).toBe(1);
		});
	});

	describe("shuffle", () => {
		it("produces swung timing on straight 8th notes", () => {
			// 8th notes at [0, 0.5, 1, 1.5]
			const eights = sequence(N.C4(0.5), N.D4(0.5), N.E4(0.5), N.F4(0.5));
			const swung = shuffle(eights, 0.67);
			const notes = collectNotes(swung);
			// Notes at 0 and 1 stay on beat; 0.5 and 1.5 get swung to ~0.67 and ~1.67
			expect(notes[0]?.startBeat).toBe(0);
			expect(notes[2]?.startBeat).toBe(1);
			// Swung beats should be at ~0.67 and ~1.67
			expect(notes[1]?.startBeat).toBeGreaterThan(0.5);
			expect(notes[3]?.startBeat).toBeGreaterThan(1.5);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(quantize(sequence(N.C4(2)), 1).endBeat - quantize(sequence(N.C4(2)), 1).startBeat).toBe(2);
		});
	});
});
