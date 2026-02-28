import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { collectNotes } from "../utils/tree";
import { random } from "./random";
describe("RandomPattern", () => {
	describe("notes", () => {
		it("generates the specified number of notes", () => {
			const pat = random({ pitches: [N.C4, N.D4, N.E4], count: 8, stepDuration: 0.5, seed: 1 });
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(8);
		});
		it("draws pitches from the given pool", () => {
			const pitches = [N.C4, N.E4, N.G4];
			const pat = random({ pitches, count: 16, stepDuration: 0.5, seed: 42 });
			const notes = collectNotes(pat);
			for (const positionedNote of notes) {
				expect(pitches).toContainEqual(positionedNote.pitch);
			}
		});
		it("places notes at sequential step beats", () => {
			const pat = random({ pitches: [N.C4], count: 3, stepDuration: 240, seed: 1 });
			const notes = collectNotes(pat);
			expect(notes[0]!.startBeat).toBe(0);
			expect(notes[1]!.startBeat).toBe(240);
			expect(notes[2]!.startBeat).toBe(480);
		});
		it("produces deterministic output with a seed", () => {
			const pat1 = random({ pitches: [N.C4, N.D4, N.E4, N.F4, N.G4], count: 8, stepDuration: 0.5, seed: 99 });
			const pat2 = random({ pitches: [N.C4, N.D4, N.E4, N.F4, N.G4], count: 8, stepDuration: 0.5, seed: 99 });
			const notes1 = collectNotes(pat1);
			const notes2 = collectNotes(pat2);
			expect(notes1.map((positionedNote) => positionedNote.pitch)).toEqual(
				notes2.map((positionedNote) => positionedNote.pitch),
			);
		});
		it("constrains velocity to the given range", () => {
			const pat = random({
				pitches: [N.C4],
				count: 16,
				stepDuration: 240,
				velocity: { min: 60, max: 80 },
				seed: 7,
			});
			const notes = collectNotes(pat);
			for (const positionedNote of notes) {
				expect(positionedNote.velocity).toBeGreaterThanOrEqual(60);
				expect(positionedNote.velocity).toBeLessThanOrEqual(80);
			}
		});
	});
});
