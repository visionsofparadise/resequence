import { describe, expect, it } from "vitest";
import { beatsToSeconds } from "./tempo-map";

describe("beatsToSeconds", () => {
	it("converts at single tempo", () => {
		expect(beatsToSeconds(1, [{ beat: 0, bpm: 120 }])).toBe(0.5);
	});

	it("returns 0 for 0 beats", () => {
		expect(beatsToSeconds(0, [{ beat: 0, bpm: 60 }])).toBe(0);
	});

	it("defaults to 120 bpm when map is empty", () => {
		expect(beatsToSeconds(1, [])).toBe(0.5);
	});

	it("handles tempo change mid-sequence", () => {
		const map = [{ beat: 0, bpm: 120 }, { beat: 2, bpm: 60 }];
		const result = beatsToSeconds(4, map);
		expect(result).toBeCloseTo(1 + 2);
	});

	it("defaults to 120 bpm before first point when not at beat 0", () => {
		const map = [{ beat: 1, bpm: 60 }];
		expect(beatsToSeconds(2, map)).toBeCloseTo(0.5 + 1);
	});
});
