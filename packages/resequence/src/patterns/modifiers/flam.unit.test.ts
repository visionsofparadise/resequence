import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { gap } from "../gap";
import { note } from "../note";
import { sequence } from "../sequence";
import { FlamPattern, flam } from "./flam";

describe("FlamPattern", () => {
	describe("notes", () => {
		it("adds a grace note for each input note", () => {
			const pat = flam(note("C4", "4n"), 60);
			expect(pat.notes).toHaveLength(2);
		});

		it("grace note has flamOffset duration", () => {
			const pat = flam(note("C4", "4n"), 60);
			expect(pat.notes[0]!.durationBeats).toBe(60);
		});

		it("grace note uses default velocity of 40", () => {
			const pat = flam(note("C4", "4n"), 60);
			expect(pat.notes[0]!.velocity).toBe(40);
		});

		it("grace note uses custom graceVelocity", () => {
			const pat = flam(note("C4", "4n"), 60, 20);
			expect(pat.notes[0]!.velocity).toBe(20);
		});

		it("clamps grace note tick to zero when note starts early", () => {
			// note at beat 0, flamOffset 60 → grace at max(0, 0-60) = 0
			const pat = flam(note("C4", "4n"), 60);
			expect(pat.notes[0]!.beat).toBe(0);
		});

		it("places grace note before main note when there is room", () => {
			// note at beat 480, flamOffset 60 → grace at 420
			const pat = flam(sequence(gap(480), note("C4", "4n")), 60);
			expect(pat.notes[0]).toMatchObject({ beat: 420, velocity: 40 });
			expect(pat.notes[1]).toMatchObject({ beat: 480 });
		});

		it("preserves pitch on both grace and main note", () => {
			const pat = flam(note("G4", "4n"), 60);
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("G4"));
			expect(pat.notes[1]!.pitch).toEqual(resolvePitch("G4"));
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(flam(note("C4", "4n"), 60).durationBeats).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a FlamPattern", () => {
			expect(flam(note("C4", "4n"), 60)).toBeInstanceOf(FlamPattern);
		});
	});
});
