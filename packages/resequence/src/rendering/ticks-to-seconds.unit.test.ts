import { describe, expect, it } from "vitest";
import { PPQ } from "../utils/duration";
import { ticksToSeconds } from "./ticks-to-seconds";

describe("ticksToSeconds", () => {
	it("converts ticks to seconds at 120 bpm", () => {
		expect(ticksToSeconds(PPQ, [{ tick: 0, bpm: 120 }])).toBe(0.5);
	});

	it("returns 0 for 0 ticks", () => {
		expect(ticksToSeconds(0, [{ tick: 0, bpm: 120 }])).toBe(0);
	});

	it("converts 2 beats at 120 bpm", () => {
		expect(ticksToSeconds(PPQ * 2, [{ tick: 0, bpm: 120 }])).toBe(1);
	});

	it("converts at 60 bpm (1 beat = 1 second)", () => {
		expect(ticksToSeconds(PPQ, [{ tick: 0, bpm: 60 }])).toBe(1);
	});

	it("converts 4 beats at 120 bpm", () => {
		expect(ticksToSeconds(PPQ * 4, [{ tick: 0, bpm: 120 }])).toBe(2);
	});

	it("defaults to 120 bpm when tempo map is empty", () => {
		expect(ticksToSeconds(PPQ, [])).toBe(0.5);
	});

	it("handles tempo change mid-sequence", () => {
		const tempoMap = [{ tick: 0, bpm: 120 }, { tick: PPQ * 2, bpm: 60 }];
		const result = ticksToSeconds(PPQ * 4, tempoMap);
		const firstHalf = ticksToSeconds(PPQ * 2, [{ tick: 0, bpm: 120 }]);
		const secondHalf = ticksToSeconds(PPQ * 2, [{ tick: 0, bpm: 60 }]);
		expect(result).toBeCloseTo(firstHalf + secondHalf);
	});

	it("defaults to 120 bpm before first tempo point when it doesn't start at 0", () => {
		const tempoMap = [{ tick: PPQ, bpm: 60 }];
		const result = ticksToSeconds(PPQ * 2, tempoMap);
		expect(result).toBeCloseTo(0.5 + 1);
	});
});
