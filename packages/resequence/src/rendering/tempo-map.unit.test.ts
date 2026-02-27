import { describe, expect, it } from "vitest";
import { note } from "../patterns/note";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";
import { repeat } from "../patterns/repeat";
import { tempo } from "../patterns/tempo";
import { beatsToSeconds, buildTempoMap } from "./tempo-map";

describe("buildTempoMap", () => {
	it("returns empty array for flat pattern with no tempo wrappers", () => {
		const result = buildTempoMap(note("C4", "4n"));
		expect(result).toEqual([]);
	});

	it("captures single tempo wrapper at root", () => {
		const result = buildTempoMap(tempo(note("C4", "4n"), 140));
		expect(result).toEqual([{ beat: 0, bpm: 140 }]);
	});

	it("captures nested tempo inside sequence at correct beat offset", () => {
		const pattern = sequence(note("C4", "4n"), tempo(note("E4", "4n"), 100));
		const result = buildTempoMap(pattern);
		expect(result).toEqual([{ beat: 1, bpm: 100 }]);
	});

	it("captures multiple tempo wrappers in sequence", () => {
		const pattern = sequence(
			tempo(note("C4", "4n"), 120),
			tempo(note("E4", "4n"), 100),
			tempo(note("G4", "4n"), 80),
		);
		const result = buildTempoMap(pattern);
		expect(result).toEqual([
			{ beat: 0, bpm: 120 },
			{ beat: 1, bpm: 100 },
			{ beat: 2, bpm: 80 },
		]);
	});

	it("captures tempo inside layer at same offset", () => {
		const pattern = layer(note("C4", "4n"), tempo(note("E4", "4n"), 90));
		const result = buildTempoMap(pattern);
		expect(result).toEqual([{ beat: 0, bpm: 90 }]);
	});

	it("captures tempo inside repeat at each iteration offset", () => {
		const pattern = repeat(tempo(note("C4", "4n"), 110), 3);
		const result = buildTempoMap(pattern);
		expect(result).toEqual([
			{ beat: 0, bpm: 110 },
			{ beat: 1, bpm: 110 },
			{ beat: 2, bpm: 110 },
		]);
	});

	it("returns sorted result", () => {
		const pattern = layer(
			tempo(sequence(note("C4", "4n"), note("E4", "4n")), 120),
			sequence(note("C4", "4n"), tempo(note("G4", "4n"), 100)),
		);
		const result = buildTempoMap(pattern);
		expect(result[0]).toEqual({ beat: 0, bpm: 120 });
		expect(result[1]).toEqual({ beat: 1, bpm: 100 });
	});

	describe("keyframes", () => {
		it("collects step keyframes at absolute positions", () => {
			const pattern = tempo(note("C4", 4), 120, {
				keyframes: [{ beat: 2, bpm: 140 }],
			});
			const result = buildTempoMap(pattern);
			expect(result).toEqual([
				{ beat: 0, bpm: 120 },
				{ beat: 2, bpm: 140 },
			]);
		});

		it("beat-0 keyframe overrides initial bpm", () => {
			const pattern = tempo(note("C4", 4), 120, {
				keyframes: [{ beat: 0, bpm: 100 }],
			});
			const result = buildTempoMap(pattern);
			expect(result).toEqual([{ beat: 0, bpm: 100 }]);
		});

		it("samples linear ramp keyframes", () => {
			const pattern = tempo(note("C4", 4), 120, {
				keyframes: [{ beat: 1, bpm: 140, curve: "linear" }],
			});
			const result = buildTempoMap(pattern);
			expect(result.length).toBeGreaterThan(2);
			expect(result[0]).toEqual({ beat: 0, bpm: 120 });
			const last = result[result.length - 1];
			expect(last?.beat).toBeCloseTo(1);
			expect(last?.bpm).toBeCloseTo(140);
		});

		it("samples exponential ramp keyframes", () => {
			const pattern = tempo(note("C4", 4), 120, {
				keyframes: [{ beat: 1, bpm: 240, curve: "exponential" }],
			});
			const result = buildTempoMap(pattern);
			expect(result.length).toBeGreaterThan(2);
			const mid = result[Math.floor(result.length / 2)];
			expect(mid?.bpm).toBeGreaterThan(120);
			expect(mid?.bpm).toBeLessThan(240);
		});

		it("offsets keyframe beats in sequence", () => {
			const pattern = sequence(
				note("C4", 4),
				tempo(note("E4", 4), 120, {
					keyframes: [{ beat: 2, bpm: 140 }],
				}),
			);
			const result = buildTempoMap(pattern);
			expect(result).toEqual([
				{ beat: 4, bpm: 120 },
				{ beat: 6, bpm: 140 },
			]);
		});
	});

	describe("override resolution", () => {
		it("outermost tempo wins by default", () => {
			const pattern = tempo(tempo(note("C4", 4), 140), 120);
			const result = buildTempoMap(pattern);
			expect(result).toEqual([{ beat: 0, bpm: 120 }]);
		});

		it("override beats outer tempo", () => {
			const pattern = tempo(
				tempo(note("C4", 4), 140, { override: true }),
				120,
			);
			const result = buildTempoMap(pattern);
			expect(result).toContainEqual({ beat: 0, bpm: 140 });
		});

		it("nested overrides — innermost wins", () => {
			const pattern = tempo(
				tempo(
					tempo(note("C4", 4), 160, { override: true }),
					140, { override: true },
				),
				120,
			);
			const result = buildTempoMap(pattern);
			expect(result).toContainEqual({ beat: 0, bpm: 160 });
		});

		it("inner non-override tempo is ignored under outer tempo", () => {
			const pattern = tempo(
				sequence(note("C4", 4), tempo(note("E4", 4), 140)),
				120,
			);
			const result = buildTempoMap(pattern);
			expect(result).toEqual([{ beat: 0, bpm: 120 }]);
		});

		it("inner override takes effect under outer tempo", () => {
			const pattern = tempo(
				sequence(
					note("C4", 4),
					tempo(note("E4", 4), 140, { override: true }),
				),
				120,
			);
			const result = buildTempoMap(pattern);
			expect(result).toContainEqual({ beat: 0, bpm: 120 });
			expect(result).toContainEqual({ beat: 4, bpm: 140 });
		});
	});
});

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
