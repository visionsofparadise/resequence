import { describe, expect, it } from "vitest";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import { layer } from "./layer";
import { note } from "./note";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("LayerPattern", () => {
	describe("durationBeats", () => {
		it("uses max child duration", () => {
			const pat = layer(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), sequence(note(resolvePitch("E4"), resolveDuration("2n"))));
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});

		it("returns 0 for empty layer", () => {
			expect(layer().endBeat - layer().startBeat).toBe(0);
		});
	});

	describe("notes", () => {
		it("places children at the same offset", () => {
			const pat = layer(
				sequence(note(resolvePitch("C4"), resolveDuration("4n"))),
				sequence(note(resolvePitch("E4"), resolveDuration("4n"))),
				sequence(note(resolvePitch("G4"), resolveDuration("4n"))),
			);
			const notes = collectNotes(pat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: resolvePitch("C4") },
				{ startBeat: 0, pitch: resolvePitch("E4") },
				{ startBeat: 0, pitch: resolvePitch("G4") },
			]);
		});

		it("returns empty for empty layer", () => {
			expect(collectNotes(layer())).toEqual([]);
		});
	});
});
