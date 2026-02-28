import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { GatePattern, gate } from "./gate";

describe("GatePattern", () => {
	describe("notes", () => {
		it("passes note through unchanged when gate fully covers it", () => {
			const pat = gate(sequence(N.C4(1)), sequence(N.E4(1)));
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(1);
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: N.C4, endBeat: 1 });
		});

		it("trims note to the gate window when gate is shorter", () => {
			// Input: C4@0 dur 1 beat; gate: E4@0 dur 0.25 beat → overlap [0, 0.25)
			const pat = gate(sequence(N.C4(1)), sequence(N.E4(0.25)));
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(1);
			expect(notes[0]).toMatchObject({ startBeat: 0, endBeat: 0.25 });
		});

		it("preserves pitch of input note", () => {
			const pat = gate(sequence(N.G4(1)), sequence(N.C4(0.25)));
			expect(collectNotes(pat)[0]!.pitch).toEqual(N.G4);
		});

		it("emits nothing when note has zero duration", () => {
			const pat = gate(sequence(N.C4(0)), sequence(N.E4(1)));
			expect(collectNotes(pat)).toHaveLength(0);
		});

		it("emits one fragment per overlapping gate window", () => {
			// Two gate windows within a single long note (2 beats)
			// gate: [0, 0.25) and [0.75, 1.0) → two fragments
			const pat = gate(sequence(N.C4(2)), sequence(N.E4(0.25), gap(0.5), N.F4(0.25)));
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(2);
			expect(notes[0]).toMatchObject({ startBeat: 0, endBeat: 0.25 });
			expect(notes[1]).toMatchObject({ startBeat: 0.75, endBeat: 1 });
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = gate(sequence(N.C4(1)), sequence(N.E4(1)));
			expect(pat.endBeat - pat.startBeat).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a GatePattern", () => {
			expect(gate(sequence(N.C4(1)), sequence(N.E4(1)))).toBeInstanceOf(GatePattern);
		});
	});
});
