import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { gap } from "../gap";
import { note } from "../note";
import { sequence } from "../sequence";
import { GatePattern, gate } from "./gate";

describe("GatePattern", () => {
	describe("notes", () => {
		it("passes note through unchanged when gate fully covers it", () => {
			const pat = gate(note("C4", "4n"), note("E4", "4n"));
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]).toMatchObject({ beat: 0, pitch: resolvePitch("C4"), durationBeats: 1 });
		});

		it("trims note to the gate window when gate is shorter", () => {
			// Input: C4@0 dur 1 beat; gate: E4@0 dur 0.25 beat → overlap [0, 0.25)
			const pat = gate(note("C4", "4n"), note("E4", "16n"));
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]).toMatchObject({ beat: 0, durationBeats: 0.25 });
		});

		it("preserves pitch of input note", () => {
			const pat = gate(note("G4", "4n"), note("C4", "16n"));
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("G4"));
		});

		it("emits nothing when note has zero duration", () => {
			const pat = gate(note("C4", 0), note("E4", "4n"));
			expect(pat.notes).toHaveLength(0);
		});

		it("emits one fragment per overlapping gate window", () => {
			// Two gate windows within a single long note (2 beats)
			// gate: [0, 0.25) and [0.75, 1.0) → two fragments
			const pat = gate(note("C4", 2), sequence(note("E4", "16n"), gap("8n"), note("F4", "16n")));
			expect(pat.notes).toHaveLength(2);
			expect(pat.notes[0]).toMatchObject({ beat: 0, durationBeats: 0.25 });
			expect(pat.notes[1]).toMatchObject({ beat: 0.75, durationBeats: 0.25 });
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(gate(note("C4", "4n"), note("E4", "4n")).durationBeats).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a GatePattern", () => {
			expect(gate(note("C4", "4n"), note("E4", "4n"))).toBeInstanceOf(GatePattern);
		});
	});
});
