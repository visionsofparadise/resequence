import { describe, expect, it } from "vitest";
import type { CurveKeyframe } from "../patterns/automate";
import { gap } from "../patterns/gap";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { trigger } from "./trigger";

describe("trigger", () => {
	it("returns empty for empty pattern", () => {
		expect(trigger(gap(1), { peak: 1, attack: 1, release: 0.5 })).toEqual([]);
	});

	it("produces step, peak, and release curve for a single hit", () => {
		const keyframes = trigger(sequence(N.C4(1)), { peak: 1, attack: 1, release: 0.5 });

		expect(keyframes[0]).toEqual({ time: 0, value: 0, curve: "step" });
		expect(keyframes[1]).toEqual({ time: 1, value: 1, curve: "linear" });
		expect(keyframes).toHaveLength(3);

		const curve = keyframes[2] as CurveKeyframe;
		expect("values" in curve).toBe(true);
		expect(curve.time).toBe(1);
	});

	it("resolves attack and release durations", () => {
		const keyframes = trigger(sequence(N.C4(1)), { peak: 1, attack: 0.25, release: 1 });

		expect(keyframes[0]).toEqual({ time: 0, value: 0, curve: "step" });
		expect(keyframes[1]).toEqual({ time: 0.25, value: 1, curve: "linear" });

		const curve = keyframes[2] as CurveKeyframe;
		expect(curve.time).toBe(0.25);
		expect(curve.duration).toBe(1);
	});

	it("release curve starts at peak and ends near zero", () => {
		const keyframes = trigger(sequence(N.C4(1)), { peak: 1, attack: 1, release: 0.5 });
		const curve = keyframes[2] as CurveKeyframe;

		expect(curve.values[0]).toBeCloseTo(1, 4);
		expect(curve.values[curve.values.length - 1]).toBeGreaterThan(0);
		expect(curve.values[curve.values.length - 1]).toBeLessThan(0.01);
	});

	it("release curve has correct values for tension=2 at midpoint", () => {
		const keyframes = trigger(sequence(N.C4(1)), { peak: 1, attack: 1, release: 1, tension: 2 });
		const curve = keyframes[2] as CurveKeyframe;

		const midIdx = Math.floor(curve.values.length / 2);
		const midProgress = 0.5 * (curve.duration / 1);
		const expected = Math.pow(1 - midProgress, 2);
		expect(curve.values[midIdx]).toBeCloseTo(expected, 1);
	});

	it("handles multiple hits", () => {
		const pattern = sequence(N.C4(1), N.D4(1));
		const keyframes = trigger(pattern, { peak: 1, attack: 1, release: 0.5 });

		const baselines = keyframes.filter((pt) => "curve" in pt && pt.curve === "step");
		expect(baselines).toHaveLength(2);
		expect(baselines[0]?.time).toBe(0);
		expect(baselines[1]?.time).toBe(1);
	});

	it("truncates release curve when next hit arrives", () => {
		const pattern = sequence(N.C4(0.5), N.D4(0.5));
		const keyframes = trigger(pattern, { peak: 1, attack: 0.1, release: 1 });

		const firstCurve = keyframes[2] as CurveKeyframe;
		expect(firstCurve.duration).toBeLessThanOrEqual(1);
	});

});
