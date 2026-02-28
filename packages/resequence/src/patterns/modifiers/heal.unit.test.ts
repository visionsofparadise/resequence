import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { gap } from "../gap";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { HealPattern, heal } from "./heal";

describe("HealPattern", () => {
	describe("notes", () => {
		it("merges consecutive same-pitch notes with zero gap", () => {
			const pat = heal(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("C4"), resolveDuration("4n"))));
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(1);
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: resolvePitch("C4"), endBeat: 2 });
		});

		it("does not merge notes with different pitch", () => {
			const pat = heal(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))));
			expect(collectNotes(pat)).toHaveLength(2);
		});

		it("merges when gap is within threshold", () => {
			const pat = heal(sequence(note(resolvePitch("C4"), 400), gap(80), note(resolvePitch("C4"), resolveDuration("4n"))), 100);
			expect(collectNotes(pat)).toHaveLength(1);
		});

		it("does not merge when gap exceeds threshold", () => {
			const pat = heal(sequence(note(resolvePitch("C4"), 400), gap(80), note(resolvePitch("C4"), resolveDuration("4n"))), 50);
			expect(collectNotes(pat)).toHaveLength(2);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = heal(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("C4"), resolveDuration("4n"))));
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a HealPattern", () => {
			expect(heal(sequence(note(resolvePitch("C4"), resolveDuration("4n"))))).toBeInstanceOf(HealPattern);
		});
	});
});
