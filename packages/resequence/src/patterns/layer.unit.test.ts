import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { layer } from "./layer";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("LayerPattern", () => {
	describe("durationBeats", () => {
		it("uses max child duration", () => {
			const pat = layer(sequence(N.C4(1)), sequence(N.E4(2)));
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});

		it("returns 0 for empty layer", () => {
			expect(layer().endBeat - layer().startBeat).toBe(0);
		});
	});

	describe("notes", () => {
		it("places children at the same offset", () => {
			const pat = layer(
				sequence(N.C4(1)),
				sequence(N.E4(1)),
				sequence(N.G4(1)),
			);
			const notes = collectNotes(pat);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: N.C4 },
				{ startBeat: 0, pitch: N.E4 },
				{ startBeat: 0, pitch: N.G4 },
			]);
		});

		it("returns empty for empty layer", () => {
			expect(collectNotes(layer())).toEqual([]);
		});
	});
});
