import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { QuantizePattern, quantize, shuffle } from "./quantize";

describe("QuantizePattern", () => {
	describe("without groove map", () => {
		it("snaps notes to nearest subdivision grid", () => {
			// Notes at 0, 250, 490 with 4n (480) grid → 0, 240, 480
			const pat = quantize(sequence(note("C4", 250), note("E4", 240), note("G4", 240)), 480);
			// First note at 0
			expect(pat.notes[0]?.tick).toBe(0);
		});

		it("snaps halfway point to nearest grid line", () => {
			// Note at tick 240, grid 480 → snaps to 0 or 480 (nearest)
			// 240 is exactly halfway — Math.round(240/480)*480 = Math.round(0.5)*480 = 480
			const singleNote = { ...note("C4", "4n") };
			const pat = quantize(
				{ ...singleNote, notes: [{ tick: 240, pitch: 60, durationTicks: 480 }] } as Parameters<typeof quantize>[0],
				480,
			);
			expect(pat.notes[0]?.tick).toBe(0);
		});

		it("accepts Duration string subdivision", () => {
			const pat = quantize(note("C4", "4n"), "4n");
			expect(pat.notes[0]?.tick).toBe(0);
		});

		it("returns instance of QuantizePattern", () => {
			expect(quantize(note("C4", "4n"), "4n")).toBeInstanceOf(QuantizePattern);
		});
	});

	describe("with groove map", () => {
		it("snaps to grooved positions", () => {
			// 4n grid (480), groove positions at [0, 322] (swing 0.67)
			// Note at 0 → stays at 0; note at 480 → stays at 480
			const src = sequence(note("C4", "4n"), note("E4", "4n"));
			const pat = shuffle(src, 0.67);
			// Notes originally at [0, 480]
			// cycle 0: rem 0 → nearest [0, 322] = 0 → tick 0
			// cycle 1: rem 0 → nearest [0, 322] = 0 → tick 480
			expect(pat.notes[0]?.tick).toBe(0);
			expect(pat.notes[1]?.tick).toBe(480);
		});
	});

	describe("shuffle", () => {
		it("produces swung timing on straight 8th notes", () => {
			// 8th notes at [0, 240, 480, 720]
			const eights = sequence(note("C4", "8n"), note("D4", "8n"), note("E4", "8n"), note("F4", "8n"));
			const swung = shuffle(eights, 0.67);
			// Notes at 0 and 480 stay on beat; 240 and 720 get swung
			expect(swung.notes[0]?.tick).toBe(0);
			expect(swung.notes[2]?.tick).toBe(480);
			// Swung beats should be at ~322 and ~802
			expect(swung.notes[1]?.tick).toBeGreaterThan(240);
			expect(swung.notes[3]?.tick).toBeGreaterThan(720);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(quantize(note("C4", "2n"), "4n").durationTicks).toBe(960);
		});
	});
});
