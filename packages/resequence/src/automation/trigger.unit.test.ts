import { describe, expect, it } from "vitest";
import type { CurveKeyframe } from "../patterns/automate";
import { gap } from "../patterns/gap";
import { note } from "../patterns/note";
import { repeat } from "../patterns/repeat";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";
import { beats, resolveDuration } from "../utils/duration";
import { trigger } from "./trigger";

describe("trigger", () => {
	it("returns empty for empty pattern", () => {
		expect(trigger(gap("4n"), { peak: 1, attack: 1, release: "8n" })).toEqual([]);
	});

	it("produces step, peak, and release curve for a single hit", () => {
		const keyframes = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: "8n" });

		expect(keyframes[0]).toEqual({ time: 0, value: 0, curve: "step" });
		expect(keyframes[1]).toEqual({ time: 1, value: 1, curve: "linear" });
		expect(keyframes).toHaveLength(3);

		const curve = keyframes[2] as CurveKeyframe;
		expect("values" in curve).toBe(true);
		expect(curve.time).toBe(1);
	});

	it("uses peak value", () => {
		const keyframes = trigger(note("C4", "4n"), { peak: 0.8, attack: 1, release: "8n" });
		expect(keyframes[1]).toEqual({ time: 1, value: 0.8, curve: "linear" });
	});

	it("resolves attack and release durations", () => {
		const keyframes = trigger(note("C4", "4n"), { peak: 1, attack: "16n", release: "4n" });

		expect(keyframes[0]).toEqual({ time: 0, value: 0, curve: "step" });
		expect(keyframes[1]).toEqual({ time: 120, value: 1, curve: "linear" });

		const curve = keyframes[2] as CurveKeyframe;
		expect(curve.time).toBe(120);
		expect(resolveDuration(curve.duration)).toBe(480);
	});

	it("release curve starts at peak and ends near zero", () => {
		const keyframes = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: "8n" });
		const curve = keyframes[2] as CurveKeyframe;

		expect(curve.values[0]).toBeCloseTo(1, 4);
		expect(curve.values[curve.values.length - 1]).toBeGreaterThan(0);
		expect(curve.values[curve.values.length - 1]).toBeLessThan(0.01);
	});

	it("release curve has correct values for tension=2 at midpoint", () => {
		const keyframes = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: beats(1), tension: 2 });
		const curve = keyframes[2] as CurveKeyframe;

		const midIdx = Math.floor(curve.values.length / 2);
		const midProgress = 0.5 * (resolveDuration(curve.duration) / beats(1));
		const expected = Math.pow(1 - midProgress, 2);
		expect(curve.values[midIdx]).toBeCloseTo(expected, 1);
	});

	it("release curve has correct values for tension=0.5 at midpoint", () => {
		const keyframes = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: beats(1), tension: 0.5 });
		const curve = keyframes[2] as CurveKeyframe;

		const midIdx = Math.floor(curve.values.length / 2);
		const midProgress = 0.5 * (resolveDuration(curve.duration) / beats(1));
		const expected = Math.pow(1 - midProgress, 0.5);
		expect(curve.values[midIdx]).toBeCloseTo(expected, 1);
	});

	it("handles multiple hits", () => {
		const pattern = sequence(note("C4", "4n"), note("D4", "4n"));
		const keyframes = trigger(pattern, { peak: 1, attack: 1, release: "8n" });

		const baselines = keyframes.filter((pt) => "curve" in pt && pt.curve === "step");
		expect(baselines).toHaveLength(2);
		expect(baselines[0]?.time).toBe(0);
		expect(baselines[1]?.time).toBe(480);
	});

	it("truncates release curve when next hit arrives", () => {
		const pattern = sequence(note("C4", "8n"), note("D4", "8n"));
		const keyframes = trigger(pattern, { peak: 1, attack: 1, release: "4n" });

		const firstCurve = keyframes[2] as CurveKeyframe;
		expect(resolveDuration(firstCurve.duration)).toBeLessThanOrEqual(240);
	});

	it("works with repeat pattern", () => {
		const pattern = repeat(note("C1", "4n"), 4);
		const keyframes = trigger(pattern, { peak: 0.9, attack: 1, release: "8n" });

		const baselines = keyframes.filter((pt) => "curve" in pt && pt.curve === "step");
		expect(baselines).toHaveLength(4);
		expect(baselines.map((pt) => pt.time)).toEqual([0, 480, 960, 1440]);
	});

	it("works with layer pattern (simultaneous notes)", () => {
		const pattern = layer(note("C4", "4n"), note("E4", "4n"));
		const keyframes = trigger(pattern, { peak: 1, attack: 1, release: "8n" });

		const baselines = keyframes.filter((pt) => "curve" in pt && pt.curve === "step");
		expect(baselines).toHaveLength(2);
		expect(baselines[0]?.time).toBe(0);
		expect(baselines[1]?.time).toBe(0);
	});
});
