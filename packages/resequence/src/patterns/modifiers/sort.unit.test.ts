import { describe, expect, it } from "vitest";
import { pitchKey, resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { SortPattern, sort } from "./sort";

describe("SortPattern", () => {
	describe("notes", () => {
		it("sorts pitches ascending by default", () => {
			// notes at beats 0, 1, 2 with pitches E4, C4, G4
			const pat = sort(
				sequence(note("E4", "4n"), note("C4", "4n"), note("G4", "4n")),
			);
			// pitches sorted asc: [C4, E4, G4], assigned to beats [0, 1, 2]
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("C4"));
			expect(pat.notes[1]!.pitch).toEqual(resolvePitch("E4"));
			expect(pat.notes[2]!.pitch).toEqual(resolvePitch("G4"));
		});

		it("preserves beat positions", () => {
			const pat = sort(sequence(note("E4", "4n"), note("C4", "4n"), note("G4", "4n")));
			expect(pat.notes[0]!.beat).toBe(0);
			expect(pat.notes[1]!.beat).toBe(1);
			expect(pat.notes[2]!.beat).toBe(2);
		});

		it("sorts pitches descending when key is desc", () => {
			const pat = sort(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), "desc");
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("G4"));
			expect(pat.notes[1]!.pitch).toEqual(resolvePitch("E4"));
			expect(pat.notes[2]!.pitch).toEqual(resolvePitch("C4"));
		});

		it("accepts a custom comparator", () => {
			// Sort by descending pitch (same as "desc")
			const pat = sort(
				sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")),
				(noteA, noteB) => pitchKey(noteB.pitch) - pitchKey(noteA.pitch),
			);
			expect(pat.notes[0]!.pitch).toEqual(resolvePitch("G4"));
			expect(pat.notes[1]!.pitch).toEqual(resolvePitch("E4"));
			expect(pat.notes[2]!.pitch).toEqual(resolvePitch("C4"));
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(sort(sequence(note("C4", "4n"), note("E4", "4n"))).durationBeats).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a SortPattern", () => {
			expect(sort(note("C4", "4n"))).toBeInstanceOf(SortPattern);
		});
	});
});
