import { describe, expect, it } from "vitest";
import { ticksToSeconds } from "./ticks-to-seconds";

describe("ticksToSeconds", () => {
	it("converts 480 ticks at 120 bpm to 0.5 seconds", () => {
		expect(ticksToSeconds(480, 120)).toBe(0.5);
	});

	it("converts 0 ticks to 0 seconds", () => {
		expect(ticksToSeconds(0, 120)).toBe(0);
	});

	it("converts 960 ticks at 120 bpm to 1 second", () => {
		expect(ticksToSeconds(960, 120)).toBe(1);
	});

	it("converts 480 ticks at 60 bpm to 1 second", () => {
		expect(ticksToSeconds(480, 60)).toBe(1);
	});

	it("converts 1920 ticks at 120 bpm to 2 seconds (one bar)", () => {
		expect(ticksToSeconds(1920, 120)).toBe(2);
	});
});
