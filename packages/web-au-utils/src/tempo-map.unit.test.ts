import { describe, expect, it } from "vitest";
import { tickToMs } from "./tempo-map";

describe("tickToMs", () => {
	it("converts ticks at constant 120 BPM", () => {
		const ppq = 480;
		const result = tickToMs(ppq, [], ppq);
		expect(result).toBe(500);
	});

	it("converts ticks with tempo change", () => {
		const ppq = 480;
		const tempoMap = [
			{ tick: 0, bpm: 120 },
			{ tick: 480, bpm: 60 },
		];

		const firstBeatMs = tickToMs(480, tempoMap, ppq);
		expect(firstBeatMs).toBe(500);

		const secondBeatMs = tickToMs(960, tempoMap, ppq);
		expect(secondBeatMs).toBe(1500);
	});

	it("uses default 120 BPM when no tempo events", () => {
		const ppq = 480;
		const result = tickToMs(960, [], ppq);
		expect(result).toBe(1000);
	});

	it("handles multiple tempo changes", () => {
		const ppq = 480;
		const tempoMap = [
			{ tick: 0, bpm: 120 },
			{ tick: 480, bpm: 240 },
			{ tick: 960, bpm: 60 },
		];

		const atTick1440 = tickToMs(1440, tempoMap, ppq);
		expect(atTick1440).toBe(500 + 250 + 1000);
	});
});
