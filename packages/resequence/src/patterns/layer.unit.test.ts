import { describe, expect, it } from "vitest";
import { layer, LayerPattern } from "./layer";
import { note } from "./note";

describe("LayerPattern", () => {
	describe("durationTicks", () => {
		it("uses max child duration", () => {
			expect(layer(note("C4", "4n"), note("E4", "2n")).durationTicks).toBe(960);
		});

		it("returns 0 for empty layer", () => {
			expect(layer().durationTicks).toBe(0);
		});

		it("uses duration override when provided", () => {
			const result = new LayerPattern([note("C4", "4n")], "1n");
			expect(result.durationTicks).toBe(1920);
		});
	});

	describe("notes", () => {
		it("places children at the same offset", () => {
			const pat = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			expect(pat.notes).toMatchObject([
				{ tick: 0, pitch: 60 },
				{ tick: 0, pitch: 64 },
				{ tick: 0, pitch: 67 },
			]);
		});

		it("returns empty for empty layer", () => {
			expect(layer().notes).toEqual([]);
		});
	});
});
