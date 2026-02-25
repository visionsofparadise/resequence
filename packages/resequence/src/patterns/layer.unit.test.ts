import { describe, expect, it } from "vitest";
import { resolvePitch } from "../utils/pitch";
import { layer, LayerPattern } from "./layer";
import { note } from "./note";

describe("LayerPattern", () => {
	describe("durationBeats", () => {
		it("uses max child duration", () => {
			expect(layer(note("C4", "4n"), note("E4", "2n")).durationBeats).toBe(2);
		});

		it("returns 0 for empty layer", () => {
			expect(layer().durationBeats).toBe(0);
		});

		it("uses duration override when provided", () => {
			const result = new LayerPattern([note("C4", "4n")], "1n");
			expect(result.durationBeats).toBe(4);
		});
	});

	describe("notes", () => {
		it("places children at the same offset", () => {
			const pat = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			expect(pat.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C4") },
				{ beat: 0, pitch: resolvePitch("E4") },
				{ beat: 0, pitch: resolvePitch("G4") },
			]);
		});

		it("returns empty for empty layer", () => {
			expect(layer().notes).toEqual([]);
		});
	});
});
