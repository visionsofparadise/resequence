import { describe, expect, it } from "vitest";
import { lfo } from "./lfo";
import { bars, beats } from "../utils/duration";

describe("lfo", () => {
	it("sine produces values in 0-1 range", () => {
		const points = lfo({ shape: "sine", rate: "4n", duration: bars(1) });
		for (const pt of points) {
			expect(pt.value).toBeGreaterThanOrEqual(0);
			expect(pt.value).toBeLessThanOrEqual(1);
		}
	});

	it("sine uses exponential curves", () => {
		const points = lfo({ shape: "sine", rate: "4n", duration: bars(1) });
		for (const pt of points) {
			expect(pt.curve).toBe("exponential");
		}
	});

	it("sine starts at 0.5 with no phase offset", () => {
		const points = lfo({ shape: "sine", rate: "4n", duration: bars(1) });
		expect(points[0]?.value).toBeCloseTo(0.5);
	});

	it("sine starts at peak with phase 0.25", () => {
		const points = lfo({ shape: "sine", rate: "4n", duration: bars(1), phase: 0.25 });
		expect(points[0]?.value).toBeCloseTo(1);
	});

	it("sine emits 4 key points per cycle", () => {
		const points = lfo({ shape: "sine", rate: bars(1), duration: bars(1) });
		expect(points.length).toBe(5);
	});

	it("saw ramps from 0 to 1", () => {
		const points = lfo({ shape: "saw", rate: bars(1), duration: bars(1) });
		expect(points[0]?.value).toBeCloseTo(0);
		const last = points.at(-1);
		expect(last?.value).toBeCloseTo(0);
	});

	it("saw uses linear ramps and step resets", () => {
		const points = lfo({ shape: "saw", rate: "4n", duration: bars(1) });
		for (const pt of points) {
			expect(pt.curve === "linear" || pt.curve === "step").toBe(true);
		}
		const resets = points.filter((pt) => pt.curve === "step");
		expect(resets.length).toBeGreaterThan(0);
	});

	it("triangle peaks at midpoint", () => {
		const points = lfo({ shape: "triangle", rate: bars(1), duration: bars(1) });
		const midpoint = points.find((pt) => {
			const phase = pt.time as number / bars(1);
			return Math.abs(phase - 0.5) < 0.01;
		});
		expect(midpoint).toBeDefined();
		expect(midpoint?.value).toBeCloseTo(1);
	});

	it("triangle uses linear curves", () => {
		const points = lfo({ shape: "triangle", rate: "4n", duration: bars(1) });
		for (const pt of points) {
			expect(pt.curve).toBe("linear");
		}
	});

	it("triangle emits 2 key points per cycle", () => {
		const points = lfo({ shape: "triangle", rate: bars(1), duration: bars(1) });
		expect(points.length).toBe(3);
	});

	it("square alternates between 0 and 1", () => {
		const points = lfo({ shape: "square", rate: "4n", duration: bars(1) });
		for (const pt of points) {
			expect(pt.value === 0 || pt.value === 1).toBe(true);
		}
	});

	it("square uses step curves", () => {
		const points = lfo({ shape: "square", rate: "4n", duration: bars(1) });
		for (const pt of points) {
			expect(pt.curve).toBe("step");
		}
	});

	it("square emits 2 key points per cycle", () => {
		const points = lfo({ shape: "square", rate: bars(1), duration: bars(1) });
		expect(points.length).toBe(3);
	});

	it("respects duration", () => {
		const points = lfo({ shape: "sine", rate: "4n", duration: bars(2) });
		const last = points.at(-1);
		expect(last?.time).toBeCloseTo(bars(2));
	});

	it("phase offset shifts waveform start", () => {
		const noPhase = lfo({ shape: "sine", rate: "4n", duration: beats(1) });
		const withPhase = lfo({ shape: "sine", rate: "4n", duration: beats(1), phase: 0.25 });
		expect(noPhase[0]?.value).toBeCloseTo(0.5);
		expect(withPhase[0]?.value).toBeCloseTo(1);
	});
});
