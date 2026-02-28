import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchKey } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { SortPattern, sort } from "./sort";

describe("SortPattern", () => {
	describe("notes", () => {
		it("sorts pitches ascending by default", () => {
			// notes at beats 0, 1, 2 with pitches E4, C4, G4
			const pat = sort(
				sequence(N.E4(1), N.C4(1), N.G4(1)),
			);
			// pitches sorted asc: [C4, E4, G4], assigned to beats [0, 1, 2]
			expect(collectNotes(pat)[0]!.pitch).toEqual(N.C4);
			expect(collectNotes(pat)[1]!.pitch).toEqual(N.E4);
			expect(collectNotes(pat)[2]!.pitch).toEqual(N.G4);
		});

		it("preserves beat positions", () => {
			const pat = sort(sequence(N.E4(1), N.C4(1), N.G4(1)));
			expect(collectNotes(pat)[0]!.startBeat).toBe(0);
			expect(collectNotes(pat)[1]!.startBeat).toBe(1);
			expect(collectNotes(pat)[2]!.startBeat).toBe(2);
		});

		it("sorts pitches descending when key is desc", () => {
			const pat = sort(sequence(N.C4(1), N.E4(1), N.G4(1)), "desc");
			expect(collectNotes(pat)[0]!.pitch).toEqual(N.G4);
			expect(collectNotes(pat)[1]!.pitch).toEqual(N.E4);
			expect(collectNotes(pat)[2]!.pitch).toEqual(N.C4);
		});

		it("accepts a custom comparator", () => {
			// Sort by descending pitch (same as "desc")
			const pat = sort(
				sequence(N.C4(1), N.E4(1), N.G4(1)),
				(noteA, noteB) => pitchKey(noteB.pitch) - pitchKey(noteA.pitch),
			);
			expect(collectNotes(pat)[0]!.pitch).toEqual(N.G4);
			expect(collectNotes(pat)[1]!.pitch).toEqual(N.E4);
			expect(collectNotes(pat)[2]!.pitch).toEqual(N.C4);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(sort(sequence(N.C4(1), N.E4(1))).endBeat - sort(sequence(N.C4(1), N.E4(1))).startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a SortPattern", () => {
			expect(sort(sequence(N.C4(1)))).toBeInstanceOf(SortPattern);
		});
	});
});
