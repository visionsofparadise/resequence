import { describe, expect, it } from "vitest";
import { trigger } from "./trigger";
import { note } from "./patterns/note";
import { sequence } from "./patterns/sequence";
import { gap } from "./patterns/gap";
import { repeat } from "./patterns/repeat";
import { layer } from "./patterns/layer";
import { beats } from "./duration";

describe("trigger", () => {
	it("returns empty for empty pattern", () => {
		expect(trigger(gap("4n"), { peak: 1, attack: 1, release: "8n" })).toEqual([]);
	});

	it("produces envelope for a single hit", () => {
		const points = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: "8n" });

		expect(points[0]).toEqual({ time: 0, value: 0, curve: "step" });
		expect(points[1]).toEqual({ time: 1, value: 1, curve: "linear" });

		expect(points.length).toBeGreaterThan(2);

		const last = points.at(-1);
		expect(last).toBeDefined();
		expect(last?.time).toBe(1 + 240);
		expect(last?.value).toBeCloseTo(0, 4);
		expect(last?.curve).toBe("linear");
	});

	it("uses peak value", () => {
		const points = trigger(note("C4", "4n"), { peak: 0.8, attack: 1, release: "8n" });

		expect(points[1]).toEqual({ time: 1, value: 0.8, curve: "linear" });
	});

	it("resolves attack and release durations", () => {
		const points = trigger(note("C4", "4n"), { peak: 1, attack: "16n", release: "4n" });

		expect(points[0]).toEqual({ time: 0, value: 0, curve: "step" });
		expect(points[1]).toEqual({ time: 120, value: 1, curve: "linear" });

		const last = points.at(-1);
		expect(last?.time).toBe(120 + 480);
	});

	it("handles multiple hits", () => {
		const pattern = sequence(note("C4", "4n"), note("D4", "4n"));
		const points = trigger(pattern, { peak: 1, attack: 1, release: "8n" });

		const baselines = points.filter((pt) => pt.curve === "step");
		expect(baselines).toHaveLength(2);
		expect(baselines[0]?.time).toBe(0);
		expect(baselines[1]?.time).toBe(480);
	});

	it("truncates release when next hit arrives", () => {
		const pattern = sequence(note("C4", "8n"), note("D4", "8n"));
		const points = trigger(pattern, { peak: 1, attack: 1, release: "4n" });

		const afterFirstPeak = points.filter(
			(pt) => pt.time > 1 && pt.time < 240 && pt.curve === "linear",
		);
		for (const pt of afterFirstPeak) {
			expect(pt.time).toBeLessThanOrEqual(240);
		}

		const secondBaseline = points.find((pt) => pt.time === 240 && pt.curve === "step");
		expect(secondBaseline).toBeDefined();
	});

	it("produces linear release with default tension (1)", () => {
		const points = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: beats(1) });

		const releasePoints = points.filter((pt) => pt.time > 1 && pt.curve === "linear");
		expect(releasePoints.length).toBeGreaterThan(1);

		for (let idx = 1; idx < releasePoints.length; idx++) {
			const prev = releasePoints[idx - 1];
			const curr = releasePoints[idx];
			if (prev && curr) {
				expect(curr.value).toBeLessThan(prev.value);
			}
		}
	});

	it("produces concave release with tension > 1", () => {
		const points = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: beats(1), tension: 3 });
		const releasePoints = points.filter((pt) => pt.time > 1 && pt.curve === "linear");

		const firstRelease = releasePoints[0];
		expect(firstRelease).toBeDefined();
		const midProgress = ((firstRelease?.time as number) - 1) / beats(1);
		const expectedValue = Math.pow(1 - midProgress, 3);
		expect(firstRelease?.value).toBeCloseTo(expectedValue, 4);
	});

	it("produces convex release with tension < 1", () => {
		const points = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: beats(1), tension: 0.5 });
		const releasePoints = points.filter((pt) => pt.time > 1 && pt.curve === "linear");

		const firstRelease = releasePoints[0];
		expect(firstRelease).toBeDefined();
		const midProgress = ((firstRelease?.time as number) - 1) / beats(1);
		const expectedValue = Math.pow(1 - midProgress, 0.5);
		expect(firstRelease?.value).toBeCloseTo(expectedValue, 4);
	});

	it("clamps final release value to epsilon", () => {
		const points = trigger(note("C4", "4n"), { peak: 1, attack: 1, release: "8n" });
		const last = points.at(-1);
		expect(last).toBeDefined();
		expect(last?.value).toBeGreaterThan(0);
		expect(last?.value).toBeLessThan(0.01);
	});

	it("works with repeat pattern", () => {
		const pattern = repeat(note("C1", "4n"), 4);
		const points = trigger(pattern, { peak: 0.9, attack: 1, release: "8n" });

		const baselines = points.filter((pt) => pt.curve === "step");
		expect(baselines).toHaveLength(4);
		expect(baselines.map((pt) => pt.time)).toEqual([0, 480, 960, 1440]);
	});

	it("works with layer pattern (simultaneous notes)", () => {
		const pattern = layer(note("C4", "4n"), note("E4", "4n"));
		const points = trigger(pattern, { peak: 1, attack: 1, release: "8n" });

		const baselines = points.filter((pt) => pt.curve === "step");
		expect(baselines).toHaveLength(2);
		expect(baselines[0]?.time).toBe(0);
		expect(baselines[1]?.time).toBe(0);
	});
});
