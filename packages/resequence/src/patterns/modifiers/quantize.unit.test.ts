import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { QuantizePattern, quantize, shuffle } from "./quantize";

describe("QuantizePattern", () => {
	describe("without groove map", () => {
		it("snaps notes to nearest subdivision grid", () => {
			// Notes at 0, 250, 490 with grid 480; first note already on beat 0
			const pat = quantize(sequence(note("C4", 250), note("E4", 240), note("G4", 240)), 480);
			// First note at 0
			expect(pat.notes[0]?.beat).toBe(0);
		});

		it("snaps halfway point down to lower grid line", () => {
			// Note at beat 0.5, grid "4n" (1 beat) → exactly halfway; <= grid/2 snaps to 0
			const singleNote = { ...note("C4", "4n") };
			const pat = quantize(
				{ ...singleNote, notes: [{ beat: 0.5, pitch: resolvePitch(60), durationBeats: 1 }] } as Parameters<typeof quantize>[0],
				"4n",
			);
			expect(pat.notes[0]?.beat).toBe(0);
		});

		it("accepts Duration string subdivision", () => {
			const pat = quantize(note("C4", "4n"), "4n");
			expect(pat.notes[0]?.beat).toBe(0);
		});

		it("returns instance of QuantizePattern", () => {
			expect(quantize(note("C4", "4n"), "4n")).toBeInstanceOf(QuantizePattern);
		});
	});

	describe("with groove map", () => {
		it("snaps to grooved positions", () => {
			// "4n" grid (1 beat), groove positions at [0, 0.67] (swing 0.67)
			// Notes originally at [0, 1]
			// cycle 0: rem 0 → nearest [0, 0.67] = 0 → beat 0
			// cycle 1: rem 0 → nearest [0, 0.67] = 0 → beat 1
			const src = sequence(note("C4", "4n"), note("E4", "4n"));
			const pat = shuffle(src, 0.67);
			expect(pat.notes[0]?.beat).toBe(0);
			expect(pat.notes[1]?.beat).toBe(1);
		});
	});

	describe("shuffle", () => {
		it("produces swung timing on straight 8th notes", () => {
			// 8th notes at [0, 0.5, 1, 1.5]
			const eights = sequence(note("C4", "8n"), note("D4", "8n"), note("E4", "8n"), note("F4", "8n"));
			const swung = shuffle(eights, 0.67);
			// Notes at 0 and 1 stay on beat; 0.5 and 1.5 get swung to ~0.67 and ~1.67
			expect(swung.notes[0]?.beat).toBe(0);
			expect(swung.notes[2]?.beat).toBe(1);
			// Swung beats should be at ~0.67 and ~1.67
			expect(swung.notes[1]?.beat).toBeGreaterThan(0.5);
			expect(swung.notes[3]?.beat).toBeGreaterThan(1.5);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(quantize(note("C4", "2n"), "4n").durationBeats).toBe(2);
		});
	});
});
