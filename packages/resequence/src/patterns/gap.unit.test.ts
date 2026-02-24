import { describe, expect, it } from "vitest";
import { gap } from "./gap";

describe("GapPattern", () => {
	describe("durationTicks", () => {
		it("resolves string duration to ticks", () => {
			expect(gap("8n").durationTicks).toBe(240);
		});

		it("resolves numeric duration as-is", () => {
			expect(gap(120).durationTicks).toBe(120);
		});
	});

	describe("notes", () => {
		it("returns empty", () => {
			expect(gap("4n").notes).toEqual([]);
		});
	});
});
