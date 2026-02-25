import { describe, expect, it } from "vitest";
import { gap } from "./gap";

describe("GapPattern", () => {
	describe("durationBeats", () => {
		it("resolves string duration to ticks", () => {
			expect(gap("8n").durationBeats).toBe(0.5);
		});

		it("resolves numeric duration as-is", () => {
			expect(gap(120).durationBeats).toBe(120);
		});
	});

	describe("notes", () => {
		it("returns empty", () => {
			expect(gap("4n").notes).toEqual([]);
		});
	});
});
