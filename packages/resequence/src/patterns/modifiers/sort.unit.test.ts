import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { pitchKey, resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { SortPattern, sort } from "./sort";

describe("SortPattern", () => {
	describe("notes", () => {
		it("sorts pitches ascending by default", () => {
			// notes at beats 0, 1, 2 with pitches E4, C4, G4
			const pat = sort(
				sequence(note(resolvePitch("E4"), resolveDuration("4n")), note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("G4"), resolveDuration("4n"))),
			);
			// pitches sorted asc: [C4, E4, G4], assigned to beats [0, 1, 2]
			expect(collectNotes(pat)[0]!.pitch).toEqual(resolvePitch("C4"));
			expect(collectNotes(pat)[1]!.pitch).toEqual(resolvePitch("E4"));
			expect(collectNotes(pat)[2]!.pitch).toEqual(resolvePitch("G4"));
		});

		it("preserves beat positions", () => {
			const pat = sort(sequence(note(resolvePitch("E4"), resolveDuration("4n")), note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("G4"), resolveDuration("4n"))));
			expect(collectNotes(pat)[0]!.startBeat).toBe(0);
			expect(collectNotes(pat)[1]!.startBeat).toBe(1);
			expect(collectNotes(pat)[2]!.startBeat).toBe(2);
		});

		it("sorts pitches descending when key is desc", () => {
			const pat = sort(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n")), note(resolvePitch("G4"), resolveDuration("4n"))), "desc");
			expect(collectNotes(pat)[0]!.pitch).toEqual(resolvePitch("G4"));
			expect(collectNotes(pat)[1]!.pitch).toEqual(resolvePitch("E4"));
			expect(collectNotes(pat)[2]!.pitch).toEqual(resolvePitch("C4"));
		});

		it("accepts a custom comparator", () => {
			// Sort by descending pitch (same as "desc")
			const pat = sort(
				sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n")), note(resolvePitch("G4"), resolveDuration("4n"))),
				(noteA, noteB) => pitchKey(noteB.pitch) - pitchKey(noteA.pitch),
			);
			expect(collectNotes(pat)[0]!.pitch).toEqual(resolvePitch("G4"));
			expect(collectNotes(pat)[1]!.pitch).toEqual(resolvePitch("E4"));
			expect(collectNotes(pat)[2]!.pitch).toEqual(resolvePitch("C4"));
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(sort(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n")))).endBeat - sort(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n")))).startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a SortPattern", () => {
			expect(sort(sequence(note(resolvePitch("C4"), resolveDuration("4n"))))).toBeInstanceOf(SortPattern);
		});
	});
});
