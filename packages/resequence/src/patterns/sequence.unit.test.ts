import { describe, expect, it } from "vitest";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import { gap } from "./gap";
import { note } from "./note";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("SequencePattern", () => {
	describe("durationBeats", () => {
		it("sums child durations", () => {
			const pat = sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("8n")));
			expect(pat.endBeat - pat.startBeat).toBe(1.5);
		});

		it("returns 0 for empty sequence", () => {
			expect(sequence().endBeat - sequence().startBeat).toBe(0);
		});
	});

	describe("notes", () => {
		it("accumulates offsets", () => {
			const pat = sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("D4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n")));
			const notes = collectNotes(pat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: resolvePitch("C4") },
				{ startBeat: 1, pitch: resolvePitch("D4") },
				{ startBeat: 2, pitch: resolvePitch("E4") },
			]);
		});

		it("skips gaps", () => {
			const pat = sequence(note(resolvePitch("C4"), resolveDuration("4n")), gap("4n"), note(resolvePitch("E4"), resolveDuration("4n")));
			const notes = collectNotes(pat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: resolvePitch("C4") },
				{ startBeat: 2, pitch: resolvePitch("E4") },
			]);
		});

		it("returns empty for empty sequence", () => {
			expect(collectNotes(sequence())).toEqual([]);
		});
	});
});
