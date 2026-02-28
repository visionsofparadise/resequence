import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { collectNotes } from "../utils/tree";
import { RandomPattern, random } from "./random";

describe("RandomPattern", () => {
	describe("notes", () => {
		it("generates the specified number of notes", () => {
			const pat = random({ pitches: [60, 62, 64], count: 8, stepDuration: "8n", seed: 1 });
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(8);
		});

		it("draws pitches from the given pool", () => {
			const pitches = [60, 64, 67]; // C4, E4, G4
			const pat = random({ pitches, count: 16, stepDuration: "8n", seed: 42 });
			const resolvedPitches = pitches.map(resolvePitch);
			const notes = collectNotes(pat);
			for (const positionedNote of notes) {
				expect(resolvedPitches).toContainEqual(positionedNote.pitch);
			}
		});

		it("places notes at sequential step beats", () => {
			const pat = random({ pitches: [60], count: 3, stepDuration: 240, seed: 1 });
			const notes = collectNotes(pat);
			expect(notes[0]!.startBeat).toBe(0);
			expect(notes[1]!.startBeat).toBe(240);
			expect(notes[2]!.startBeat).toBe(480);
		});

		it("produces deterministic output with a seed", () => {
			const pat1 = random({ pitches: [60, 62, 64, 65, 67], count: 8, stepDuration: "8n", seed: 99 });
			const pat2 = random({ pitches: [60, 62, 64, 65, 67], count: 8, stepDuration: "8n", seed: 99 });
			const notes1 = collectNotes(pat1);
			const notes2 = collectNotes(pat2);
			expect(notes1.map((positionedNote) => positionedNote.pitch)).toEqual(
				notes2.map((positionedNote) => positionedNote.pitch),
			);
		});

		it("constrains velocity to the given range", () => {
			const pat = random({
				pitches: [60],
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

	describe("durationBeats", () => {
		it("equals count x stepDuration", () => {
			const pat = random({ pitches: [60], count: 4, stepDuration: "4n", seed: 1 });
			expect(pat.endBeat - pat.startBeat).toBe(4);
		});
	});

	describe("instanceof", () => {
		it("is a RandomPattern", () => {
			expect(random({ pitches: [60], count: 4, stepDuration: "4n", seed: 1 })).toBeInstanceOf(RandomPattern);
		});
	});
});
