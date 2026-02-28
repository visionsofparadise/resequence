import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { HarmonizePattern, harmonize } from "./harmonize";

describe("HarmonizePattern", () => {
	describe("notes", () => {
		it("doubles each note at the parallel interval", () => {
			const pat = harmonize(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 7);
			expect(collectNotes(pat)).toMatchObject([
				{ startBeat: 0, pitch: resolvePitch("C4") },
				{ startBeat: 0, pitch: resolvePitch("G4") },
			]);
		});

		it("produces 2x the original note count", () => {
			const pat = harmonize(sequence(note(resolvePitch("C4"), resolveDuration("8n")), note(resolvePitch("E4"), resolveDuration("8n"))), 4);
			expect(collectNotes(pat)).toHaveLength(4);
		});

		it("each pair shares the same tick and duration", () => {
			const pat = harmonize(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 5);
			const notes = collectNotes(pat);
			expect(notes[0]?.startBeat).toBe(notes[1]?.startBeat);
			expect(notes[0]!.endBeat - notes[0]!.startBeat).toBe(notes[1]!.endBeat - notes[1]!.startBeat);
		});

		it("returns empty for empty child", () => {
			expect(collectNotes(harmonize(sequence(), 4))).toEqual([]);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = harmonize(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), 3);
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a HarmonizePattern", () => {
			expect(harmonize(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 7)).toBeInstanceOf(HarmonizePattern);
		});
	});
});
