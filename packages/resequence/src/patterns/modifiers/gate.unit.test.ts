import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { gap } from "../gap";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { GatePattern, gate } from "./gate";

describe("GatePattern", () => {
	describe("notes", () => {
		it("passes note through unchanged when gate fully covers it", () => {
			const pat = gate(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), sequence(note(resolvePitch("E4"), resolveDuration("4n"))));
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(1);
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: resolvePitch("C4"), endBeat: 1 });
		});

		it("trims note to the gate window when gate is shorter", () => {
			// Input: C4@0 dur 1 beat; gate: E4@0 dur 0.25 beat → overlap [0, 0.25)
			const pat = gate(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), sequence(note(resolvePitch("E4"), resolveDuration("16n"))));
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(1);
			expect(notes[0]).toMatchObject({ startBeat: 0, endBeat: 0.25 });
		});

		it("preserves pitch of input note", () => {
			const pat = gate(sequence(note(resolvePitch("G4"), resolveDuration("4n"))), sequence(note(resolvePitch("C4"), resolveDuration("16n"))));
			expect(collectNotes(pat)[0]!.pitch).toEqual(resolvePitch("G4"));
		});

		it("emits nothing when note has zero duration", () => {
			const pat = gate(sequence(note(resolvePitch("C4"), 0)), sequence(note(resolvePitch("E4"), resolveDuration("4n"))));
			expect(collectNotes(pat)).toHaveLength(0);
		});

		it("emits one fragment per overlapping gate window", () => {
			// Two gate windows within a single long note (2 beats)
			// gate: [0, 0.25) and [0.75, 1.0) → two fragments
			const pat = gate(sequence(note(resolvePitch("C4"), 2)), sequence(note(resolvePitch("E4"), resolveDuration("16n")), gap("8n"), note(resolvePitch("F4"), resolveDuration("16n"))));
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(2);
			expect(notes[0]).toMatchObject({ startBeat: 0, endBeat: 0.25 });
			expect(notes[1]).toMatchObject({ startBeat: 0.75, endBeat: 1 });
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = gate(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), sequence(note(resolvePitch("E4"), resolveDuration("4n"))));
			expect(pat.endBeat - pat.startBeat).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a GatePattern", () => {
			expect(gate(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), sequence(note(resolvePitch("E4"), resolveDuration("4n"))))).toBeInstanceOf(GatePattern);
		});
	});
});
