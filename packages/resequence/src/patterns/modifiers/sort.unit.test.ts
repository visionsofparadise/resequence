import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { SortPattern, sort } from "./sort";

describe("SortPattern", () => {
	describe("notes", () => {
		it("sorts pitches ascending by default", () => {
			// notes at ticks 0, 480, 960 with pitches E4, C4, G4
			const pat = sort(
				sequence(note("E4", "4n"), note("C4", "4n"), note("G4", "4n")),
			);
			// pitches sorted asc: [60, 64, 67], assigned to ticks [0, 480, 960]
			expect(pat.notes[0]!.pitch).toBe(60); // C4
			expect(pat.notes[1]!.pitch).toBe(64); // E4
			expect(pat.notes[2]!.pitch).toBe(67); // G4
		});

		it("preserves tick positions", () => {
			const pat = sort(sequence(note("E4", "4n"), note("C4", "4n"), note("G4", "4n")));
			expect(pat.notes[0]!.tick).toBe(0);
			expect(pat.notes[1]!.tick).toBe(480);
			expect(pat.notes[2]!.tick).toBe(960);
		});

		it("sorts pitches descending when key is desc", () => {
			const pat = sort(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), "desc");
			expect(pat.notes[0]!.pitch).toBe(67); // G4
			expect(pat.notes[1]!.pitch).toBe(64); // E4
			expect(pat.notes[2]!.pitch).toBe(60); // C4
		});

		it("accepts a custom comparator", () => {
			// Sort by descending pitch (same as "desc")
			const pat = sort(
				sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")),
				(noteA, noteB) => noteB.pitch - noteA.pitch,
			);
			expect(pat.notes[0]!.pitch).toBe(67); // G4
			expect(pat.notes[1]!.pitch).toBe(64); // E4
			expect(pat.notes[2]!.pitch).toBe(60); // C4
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(sort(sequence(note("C4", "4n"), note("E4", "4n"))).durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is a SortPattern", () => {
			expect(sort(note("C4", "4n"))).toBeInstanceOf(SortPattern);
		});
	});
});
