import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { LevelPattern, humanize, level } from "./level";

describe("LevelPattern", () => {
	describe("notes", () => {
		it("sets velocity to a fixed value", () => {
			const pat = level(sequence(N.C4(1, { velocity: 80 })), { velocity: 64 });
			expect(collectNotes(pat)[0]!.velocity).toBe(64);
		});

		it("expands velocity spread from the mean", () => {
			// mean = (60+100)/2 = 80, expand 2 → 80+2*(60-80)=40 and 80+2*(100-80)=120
			const pat = level(
				sequence(N.C4(1, { velocity: 60 }), N.E4(1, { velocity: 100 })),
				{ velocity: { expand: 2 } },
			);
			expect(collectNotes(pat)[0]!.velocity).toBe(40);
			expect(collectNotes(pat)[1]!.velocity).toBe(120);
		});

		it("compresses velocity toward the mean", () => {
			// mean = (60+100)/2 = 80, compress 0.5 → 80+0.5*(60-80)=70 and 80+0.5*(100-80)=90
			const pat = level(
				sequence(N.C4(1, { velocity: 60 }), N.E4(1, { velocity: 100 })),
				{ velocity: { compress: 0.5 } },
			);
			expect(collectNotes(pat)[0]!.velocity).toBe(70);
			expect(collectNotes(pat)[1]!.velocity).toBe(90);
		});

		it("randomizes velocity deterministically with seed", () => {
			const pat1 = level(sequence(N.C4(1)), { velocity: { randomize: 20, seed: 42 } });
			const pat2 = level(sequence(N.C4(1)), { velocity: { randomize: 20, seed: 42 } });
			expect(collectNotes(pat1)[0]!.velocity).toBe(collectNotes(pat2)[0]!.velocity);
		});

		it("clamps velocity to max", () => {
			const pat = level(sequence(N.C4(1, { velocity: 60 })), { velocity: { value: 200, max: 127 } });
			expect(collectNotes(pat)[0]!.velocity).toBe(127);
		});

		it("clamps velocity to min", () => {
			const pat = level(sequence(N.C4(1, { velocity: 60 })), { velocity: { value: 0, min: 1 } });
			expect(collectNotes(pat)[0]!.velocity).toBe(1);
		});

		it("sets a CC to a fixed value", () => {
			const pat = level(sequence(N.C4(1)), { cc: { 1: 64 } });
			expect(collectNotes(pat)[0]!.cc?.[1]).toBe(64);
		});

		it("applies CC transform independently of velocity", () => {
			const pat = level(sequence(N.C4(1, { velocity: 80 })), { velocity: 100, cc: { 7: 64 } });
			expect(collectNotes(pat)[0]!.velocity).toBe(100);
			expect(collectNotes(pat)[0]!.cc?.[7]).toBe(64);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(level(sequence(N.C4(1)), { velocity: 64 }).endBeat - level(sequence(N.C4(1)), { velocity: 64 }).startBeat).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a LevelPattern", () => {
			expect(level(sequence(N.C4(1)), {})).toBeInstanceOf(LevelPattern);
		});
	});
});

describe("humanize", () => {
	it("randomizes velocity within ±amount of original", () => {
		const pat = humanize(sequence(N.C4(1, { velocity: 100 })), 20, 42);
		expect(collectNotes(pat)[0]!.velocity).toBeGreaterThanOrEqual(80);
		expect(collectNotes(pat)[0]!.velocity).toBeLessThanOrEqual(120);
	});

	it("produces deterministic results with a seed", () => {
		const pat1 = humanize(sequence(N.C4(1)), 20, 99);
		const pat2 = humanize(sequence(N.C4(1)), 20, 99);
		expect(collectNotes(pat1)[0]!.velocity).toBe(collectNotes(pat2)[0]!.velocity);
	});
});
