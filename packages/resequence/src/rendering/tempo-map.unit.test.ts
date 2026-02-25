import { describe, expect, it } from "vitest";
import { note } from "../patterns/note";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";
import { repeat } from "../patterns/repeat";
import { tempo } from "../patterns/tempo";
import { PPQ } from "../utils/duration";
import { buildTempoMap, ticksToSeconds } from "./tempo-map";

describe("buildTempoMap", () => {
	it("returns empty array for flat pattern with no tempo wrappers", () => {
		const result = buildTempoMap(note("C4", "4n"));
		expect(result).toEqual([]);
	});

	it("captures single tempo wrapper at root", () => {
		const result = buildTempoMap(tempo(note("C4", "4n"), 140));
		expect(result).toEqual([{ tick: 0, bpm: 140 }]);
	});

	it("captures nested tempo inside sequence at correct tick offset", () => {
		const pattern = sequence(note("C4", "4n"), tempo(note("E4", "4n"), 100));
		const result = buildTempoMap(pattern);
		expect(result).toEqual([{ tick: PPQ, bpm: 100 }]);
	});

	it("captures multiple tempo wrappers in sequence", () => {
		const pattern = sequence(
			tempo(note("C4", "4n"), 120),
			tempo(note("E4", "4n"), 100),
			tempo(note("G4", "4n"), 80),
		);
		const result = buildTempoMap(pattern);
		expect(result).toEqual([
			{ tick: 0, bpm: 120 },
			{ tick: PPQ, bpm: 100 },
			{ tick: PPQ * 2, bpm: 80 },
		]);
	});

	it("captures tempo inside layer at same offset", () => {
		const pattern = layer(note("C4", "4n"), tempo(note("E4", "4n"), 90));
		const result = buildTempoMap(pattern);
		expect(result).toEqual([{ tick: 0, bpm: 90 }]);
	});

	it("captures tempo inside repeat at each iteration offset", () => {
		const pattern = repeat(tempo(note("C4", "4n"), 110), 3);
		const result = buildTempoMap(pattern);
		expect(result).toEqual([
			{ tick: 0, bpm: 110 },
			{ tick: PPQ, bpm: 110 },
			{ tick: PPQ * 2, bpm: 110 },
		]);
	});

	it("returns sorted result", () => {
		const pattern = layer(
			tempo(sequence(note("C4", "4n"), note("E4", "4n")), 120),
			sequence(note("C4", "4n"), tempo(note("G4", "4n"), 100)),
		);
		const result = buildTempoMap(pattern);
		expect(result[0]).toEqual({ tick: 0, bpm: 120 });
		expect(result[1]).toEqual({ tick: PPQ, bpm: 100 });
	});
});

describe("ticksToSeconds", () => {
	it("converts at single tempo", () => {
		expect(ticksToSeconds(PPQ, [{ tick: 0, bpm: 120 }])).toBe(0.5);
	});

	it("returns 0 for 0 ticks", () => {
		expect(ticksToSeconds(0, [{ tick: 0, bpm: 60 }])).toBe(0);
	});

	it("defaults to 120 bpm when map is empty", () => {
		expect(ticksToSeconds(PPQ, [])).toBe(0.5);
	});

	it("handles tempo change mid-sequence", () => {
		const map = [{ tick: 0, bpm: 120 }, { tick: PPQ * 2, bpm: 60 }];
		const result = ticksToSeconds(PPQ * 4, map);
		expect(result).toBeCloseTo(1 + 2);
	});

	it("defaults to 120 bpm before first point when not at tick 0", () => {
		const map = [{ tick: PPQ, bpm: 60 }];
		expect(ticksToSeconds(PPQ * 2, map)).toBeCloseTo(0.5 + 1);
	});
});
