import { random } from "./random";
import { N, collectNotes, pitchKey } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("random", () => {
	it("generates the specified number of notes", () => {
		const pat = random({ pitches: [N.C4(1).pitch, N.D4(1).pitch, N.E4(1).pitch], count: 8, stepDuration: 0.5, seed: 1 });
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(8);
	});

	it("draws pitches from the given pool", () => {
		const pitches = [N.C4(1).pitch, N.E4(1).pitch, N.G4(1).pitch];
		const pat = random({ pitches, count: 16, stepDuration: 0.5, seed: 42 });
		const notes = collectNotes(pat);
		const pitchKeys = pitches.map(pitchKey);
		for (const n of notes) {
			expect(pitchKeys).toContain(pitchKey(n.note.pitch));
		}
	});

	it("places notes at sequential step beats", () => {
		const pat = random({ pitches: [N.C4(1).pitch], count: 3, stepDuration: 0.5, seed: 1 });
		const notes = collectNotes(pat);
		const sorted = notes.sort((a, b) => (a.absoluteBeat + a.note.startBeat) - (b.absoluteBeat + b.note.startBeat));
		expect(sorted[0]!.absoluteBeat).toBe(0);
		expect(sorted[1]!.absoluteBeat).toBe(0.5);
		expect(sorted[2]!.absoluteBeat).toBe(1);
	});

	it("produces deterministic output with a seed", () => {
		const pitches = [N.C4(1).pitch, N.D4(1).pitch, N.E4(1).pitch, N.F4(1).pitch, N.G4(1).pitch];
		const pat1 = random({ pitches, count: 8, stepDuration: 0.5, seed: 99 });
		const pat2 = random({ pitches, count: 8, stepDuration: 0.5, seed: 99 });
		const notes1 = collectNotes(pat1);
		const notes2 = collectNotes(pat2);
		expect(notes1.map((n) => pitchKey(n.note.pitch))).toEqual(
			notes2.map((n) => pitchKey(n.note.pitch)),
		);
	});

	it("constrains velocity to the given range", () => {
		const pat = random({
			pitches: [N.C4(1).pitch],
			count: 16,
			stepDuration: 0.5,
			velocity: { min: 60, max: 80 },
			seed: 7,
		});
		const notes = collectNotes(pat);
		for (const n of notes) {
			expect(n.note.velocity).toBeGreaterThanOrEqual(60);
			expect(n.note.velocity).toBeLessThanOrEqual(80);
		}
	});
});
