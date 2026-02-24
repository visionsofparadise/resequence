import { describe, expect, it } from "vitest";
import { gap } from "../gap";
import { note } from "../note";
import { sequence } from "../sequence";
import { GatePattern, gate } from "./gate";

describe("GatePattern", () => {
	describe("notes", () => {
		it("passes note through unchanged when gate fully covers it", () => {
			const pat = gate(note("C4", "4n"), note("E4", "4n"));
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]).toMatchObject({ tick: 0, pitch: 60, durationTicks: 480 });
		});

		it("trims note to the gate window when gate is shorter", () => {
			// Input: C4@0 dur 480; gate: E4@0 dur 120 → overlap [0, 120)
			const pat = gate(note("C4", "4n"), note("E4", 120));
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]).toMatchObject({ tick: 0, durationTicks: 120 });
		});

		it("preserves pitch of input note", () => {
			const pat = gate(note("G4", "4n"), note("C4", 120));
			expect(pat.notes[0]!.pitch).toBe(67);
		});

		it("emits nothing when note has zero duration", () => {
			const pat = gate(note("C4", 0), note("E4", "4n"));
			expect(pat.notes).toHaveLength(0);
		});

		it("emits one fragment per overlapping gate window", () => {
			// Two gate windows within a single long note
			// gate: [0,120) and [360,480) → two fragments
			const pat = gate(note("C4", 960), sequence(note("E4", 120), gap(240), note("F4", 120)));
			expect(pat.notes).toHaveLength(2);
			expect(pat.notes[0]).toMatchObject({ tick: 0, durationTicks: 120 });
			expect(pat.notes[1]).toMatchObject({ tick: 360, durationTicks: 120 });
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(gate(note("C4", "4n"), note("E4", "4n")).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is a GatePattern", () => {
			expect(gate(note("C4", "4n"), note("E4", "4n"))).toBeInstanceOf(GatePattern);
		});
	});
});
