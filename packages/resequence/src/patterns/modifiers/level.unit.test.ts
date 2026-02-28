import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { level } from "./level";

describe("level", () => {
	it("sets velocity to a fixed value", () => {
		const pat = level(N.C4(1, { velocity: 80 }), { velocity: 64 });
		expect(collectNotes(pat)[0]!.velocity).toBe(64);
	});

	it("expands velocity spread from the mean", () => {
		const pat = level(
			sequence(N.C4(1, { velocity: 60 }), N.E4(1, { velocity: 100 })),
			{ velocity: { expand: 2 } },
		);
		expect(collectNotes(pat)[0]!.velocity).toBe(40);
		expect(collectNotes(pat)[1]!.velocity).toBe(120);
	});

	it("randomizes velocity deterministically with seed", () => {
		const pat1 = level(N.C4(1), { velocity: { randomize: 20, seed: 42 } });
		const pat2 = level(N.C4(1), { velocity: { randomize: 20, seed: 42 } });
		expect(collectNotes(pat1)[0]!.velocity).toBe(collectNotes(pat2)[0]!.velocity);
	});

	it("clamps velocity to max", () => {
		const pat = level(N.C4(1, { velocity: 60 }), { velocity: { value: 200, max: 127 } });
		expect(collectNotes(pat)[0]!.velocity).toBe(127);
	});

	it("clamps velocity to min", () => {
		const pat = level(N.C4(1, { velocity: 60 }), { velocity: { value: 0, min: 1 } });
		expect(collectNotes(pat)[0]!.velocity).toBe(1);
	});

	it("sets a CC to a fixed value", () => {
		const pat = level(N.C4(1), { cc: { 1: 64 } });
		expect(collectNotes(pat)[0]!.cc?.[1]).toBe(64);
	});
});
