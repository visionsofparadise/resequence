import { describe, expect, it } from "vitest";
import { PatternsError } from "../error";
import { N } from "../tunings/chromatic";
import { sequence } from "./sequence";
import { tempo, TempoPattern } from "./tempo";

describe("tempo", () => {
	it("wraps a child pattern with bpm", () => {
		const child = sequence(N.C4(4));
		const t = tempo(child, 120);
		expect(t.properties.bpm).toBe(120);
		expect(t.startBeat).toBe(0);
		expect(t.endBeat).toBe(4);
		expect(t.children).toHaveLength(1);
	});

	it("throws on invalid bpm", () => {
		const child = sequence(N.C4(1));
		expect(() => tempo(child, 0)).toThrow(PatternsError);
		expect(() => tempo(child, -1)).toThrow(PatternsError);
	});

	it("accepts keyframes", () => {
		const child = sequence(N.C4(4));
		const t = tempo(child, 120, { keyframes: [{ beat: 2, value: 140 }] });
		expect(t.properties.keyframes).toHaveLength(1);
	});

	it("validates keyframe beats", () => {
		const child = sequence(N.C4(1));
		expect(() => tempo(child, 120, { keyframes: [{ beat: -1, value: 100 }] })).toThrow(PatternsError);
	});

	it("validates keyframe values", () => {
		const child = sequence(N.C4(1));
		expect(() => tempo(child, 120, { keyframes: [{ beat: 0, value: -1 }] })).toThrow(PatternsError);
	});

	it("defaults isOverride to false", () => {
		const child = sequence(N.C4(1));
		const t = tempo(child, 120);
		expect(t.properties.isOverride).toBe(false);
	});

	it("respects override option", () => {
		const child = sequence(N.C4(1));
		const t = tempo(child, 120, { override: true });
		expect(t.properties.isOverride).toBe(true);
	});

	it("is detectable with TempoPattern.is()", () => {
		const t = tempo(sequence(N.C4(1)), 120);
		expect(TempoPattern.is(t)).toBe(true);
	});
});
