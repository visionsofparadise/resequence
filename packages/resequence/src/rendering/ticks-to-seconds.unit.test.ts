import { describe, expect, it } from "vitest";
import { beatsToSeconds } from "./tempo-map";

describe("beatsToSeconds", () => {
	it("converts beats to seconds at 120 bpm", () => {
		expect(beatsToSeconds(1, [{ beat: 0, bpm: 120 }])).toBe(0.5);
	});

	it("returns 0 for 0 beats", () => {
		expect(beatsToSeconds(0, [{ beat: 0, bpm: 120 }])).toBe(0);
	});

	it("converts 2 beats at 120 bpm", () => {
		expect(beatsToSeconds(2, [{ beat: 0, bpm: 120 }])).toBe(1);
	});

	it("converts at 60 bpm (1 beat = 1 second)", () => {
		expect(beatsToSeconds(1, [{ beat: 0, bpm: 60 }])).toBe(1);
	});

	it("converts 4 beats at 120 bpm", () => {
		expect(beatsToSeconds(4, [{ beat: 0, bpm: 120 }])).toBe(2);
	});

	it("defaults to 120 bpm when tempo map is empty", () => {
		expect(beatsToSeconds(1, [])).toBe(0.5);
	});

	it("handles tempo change mid-sequence", () => {
		const tempoMap = [{ beat: 0, bpm: 120 }, { beat: 2, bpm: 60 }];
		const result = beatsToSeconds(4, tempoMap);
		const firstHalf = beatsToSeconds(2, [{ beat: 0, bpm: 120 }]);
		const secondHalf = beatsToSeconds(2, [{ beat: 0, bpm: 60 }]);
		expect(result).toBeCloseTo(firstHalf + secondHalf);
	});

	it("defaults to 120 bpm before first tempo point when it doesn't start at 0", () => {
		const tempoMap = [{ beat: 1, bpm: 60 }];
		const result = beatsToSeconds(2, tempoMap);
		expect(result).toBeCloseTo(0.5 + 1);
	});
});
