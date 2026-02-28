import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { JitterPattern, jitter } from "./jitter";

describe("JitterPattern", () => {
	describe("notes", () => {
		it("produces same output every run with a seed", () => {
			const src = sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n")), note(resolvePitch("G4"), resolveDuration("4n")));
			const pat1 = jitter(src, 60, 42);
			const pat2 = jitter(src, 60, 42);
			expect(collectNotes(pat1).map((positionedNote) => positionedNote.startBeat)).toEqual(
				collectNotes(pat2).map((positionedNote) => positionedNote.startBeat),
			);
		});

		it("produces different output with different seeds", () => {
			const src = sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n")), note(resolvePitch("G4"), resolveDuration("4n")));
			const pat1 = jitter(src, 60, 1);
			const pat2 = jitter(src, 60, 2);
			const ticks1 = collectNotes(pat1).map((positionedNote) => positionedNote.startBeat);
			const ticks2 = collectNotes(pat2).map((positionedNote) => positionedNote.startBeat);
			expect(ticks1).not.toEqual(ticks2);
		});

		it("clamps tick positions to minimum 0", () => {
			const pat = jitter(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 1000, 1);
			expect(collectNotes(pat)[0]?.startBeat).toBeGreaterThanOrEqual(0);
		});

		it("accepts Duration string amount", () => {
			const pat = jitter(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "8n", 1);
			expect(collectNotes(pat)).toHaveLength(1);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(jitter(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), 30, 1).endBeat - jitter(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), 30, 1).startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a JitterPattern", () => {
			expect(jitter(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 10)).toBeInstanceOf(JitterPattern);
		});
	});
});
