import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { FlamPattern, flam } from "./flam";

describe("FlamPattern", () => {
	describe("notes", () => {
		it("adds a grace note for each input note", () => {
			const pat = flam(sequence(N.C4(1)), 60);
			expect(collectNotes(pat)).toHaveLength(2);
		});

		it("grace note has flamOffset duration", () => {
			const pat = flam(sequence(N.C4(1)), 60);
			const notes = collectNotes(pat);
			expect(notes[0]!.endBeat - notes[0]!.startBeat).toBe(60);
		});

		it("grace note uses default velocity of 40", () => {
			const pat = flam(sequence(N.C4(1)), 60);
			expect(collectNotes(pat)[0]!.velocity).toBe(40);
		});

		it("grace note uses custom graceVelocity", () => {
			const pat = flam(sequence(N.C4(1)), 60, 20);
			expect(collectNotes(pat)[0]!.velocity).toBe(20);
		});

		it("places grace note before main note even when it goes negative", () => {
			// note at beat 0, flamOffset 60 → grace at 0-60 = -60
			const pat = flam(sequence(N.C4(1)), 60);
			expect(collectNotes(pat)[0]!.startBeat).toBe(-60);
		});

		it("places grace note before main note when there is room", () => {
			// note at beat 480, flamOffset 60 → grace at 420
			const pat = flam(sequence(gap(480), N.C4(1)), 60);
			const notes = collectNotes(pat);
			expect(notes[0]).toMatchObject({ startBeat: 420, velocity: 40 });
			expect(notes[1]).toMatchObject({ startBeat: 480 });
		});

		it("preserves pitch on both grace and main note", () => {
			const pat = flam(sequence(N.G4(1)), 60);
			const notes = collectNotes(pat);
			expect(notes[0]!.pitch).toEqual(N.G4);
			expect(notes[1]!.pitch).toEqual(N.G4);
		});
	});

	describe("durationBeats", () => {
		it("extends to cover grace note", () => {
			// grace at -60 to 0, main at 0 to 1 → extent = 61
			const pat = flam(sequence(N.C4(1)), 60);
			expect(pat.endBeat - pat.startBeat).toBe(61);
		});
	});

	describe("instanceof", () => {
		it("is a FlamPattern", () => {
			expect(flam(sequence(N.C4(1)), 60)).toBeInstanceOf(FlamPattern);
		});
	});
});
