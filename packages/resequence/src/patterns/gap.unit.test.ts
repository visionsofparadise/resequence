import { describe, expect, it } from "vitest";
import { gap } from "./gap";

describe("GapPattern", () => {
	describe("durationBeats", () => {
		it("resolves fractional beat duration", () => {
			const g = gap(0.5);
			expect(g.endBeat - g.startBeat).toBe(0.5);
		});

		it("resolves numeric duration as-is", () => {
			const g = gap(120);
			expect(g.endBeat - g.startBeat).toBe(120);
		});
	});

	describe("notes", () => {
		it("returns empty", () => {
			expect(gap(1).notes).toEqual([]);
		});
	});
});
