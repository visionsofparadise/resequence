import { describe, expect, it } from "vitest";
import { bars, beats } from "../utils/duration";
import { lfo } from "./lfo";

describe("lfo", () => {
	it("sine produces values in 0-1 range", () => {
		const keyframes = lfo({ shape: "sine", rate: "4n", duration: bars(1) });
		for (const kf of keyframes) {
			expect(kf.value).toBeGreaterThanOrEqual(0);
			expect(kf.value).toBeLessThanOrEqual(1);
		}
	});

	it("sine uses exponential curves", () => {
		const keyframes = lfo({ shape: "sine", rate: "4n", duration: bars(1) });
		for (const kf of keyframes) {
			expect(kf.curve).toBe("exponential");
		}
	});

	it("sine starts at 0.5 with no phase offset", () => {
		const keyframes = lfo({ shape: "sine", rate: "4n", duration: bars(1) });
		expect(keyframes[0]?.value).toBeCloseTo(0.5);
	});

	it("sine starts at peak with phase 0.25", () => {
		const keyframes = lfo({ shape: "sine", rate: "4n", duration: bars(1), phase: 0.25 });
		expect(keyframes[0]?.value).toBeCloseTo(1);
	});

	it("sine emits 4 key keyframes per cycle", () => {
		const keyframes = lfo({ shape: "sine", rate: bars(1), duration: bars(1) });
		expect(keyframes.length).toBe(5);
	});

	it("saw ramps from 0 to 1", () => {
		const keyframes = lfo({ shape: "sawtooth", rate: bars(1), duration: bars(1) });
		expect(keyframes[0]?.value).toBeCloseTo(0);
		const last = keyframes.at(-1);
		expect(last?.value).toBeCloseTo(0);
	});

	it("saw uses linear ramps and step resets", () => {
		const keyframes = lfo({ shape: "sawtooth", rate: "4n", duration: bars(1) });
		for (const kf of keyframes) {
			expect(kf.curve === "linear" || kf.curve === "step").toBe(true);
		}
		const resets = keyframes.filter((kf) => kf.curve === "step");
		expect(resets.length).toBeGreaterThan(0);
	});

	it("triangle peaks at midpoint", () => {
		const keyframes = lfo({ shape: "triangle", rate: bars(1), duration: bars(1) });
		const midpoint = keyframes.find((kf) => {
			const phase = (kf.time as number) / bars(1);
			return Math.abs(phase - 0.5) < 0.01;
		});
		expect(midpoint).toBeDefined();
		expect(midpoint?.value).toBeCloseTo(1);
	});

	it("triangle uses linear curves", () => {
		const keyframes = lfo({ shape: "triangle", rate: "4n", duration: bars(1) });
		for (const kf of keyframes) {
			expect(kf.curve).toBe("linear");
		}
	});

	it("triangle emits 2 key keyframes per cycle", () => {
		const keyframes = lfo({ shape: "triangle", rate: bars(1), duration: bars(1) });
		expect(keyframes.length).toBe(3);
	});

	it("square alternates between 0 and 1", () => {
		const keyframes = lfo({ shape: "square", rate: "4n", duration: bars(1) });
		for (const kf of keyframes) {
			expect(kf.value === 0 || kf.value === 1).toBe(true);
		}
	});

	it("square uses step curves", () => {
		const keyframes = lfo({ shape: "square", rate: "4n", duration: bars(1) });
		for (const kf of keyframes) {
			expect(kf.curve).toBe("step");
		}
	});

	it("square emits 2 key keyframes per cycle", () => {
		const keyframes = lfo({ shape: "square", rate: bars(1), duration: bars(1) });
		expect(keyframes.length).toBe(3);
	});

	it("respects duration", () => {
		const keyframes = lfo({ shape: "sine", rate: "4n", duration: bars(2) });
		const last = keyframes.at(-1);
		expect(last?.time).toBeCloseTo(bars(2));
	});

	it("phase offset shifts waveform start", () => {
		const noPhase = lfo({ shape: "sine", rate: "4n", duration: beats(1) });
		const withPhase = lfo({ shape: "sine", rate: "4n", duration: beats(1), phase: 0.25 });
		expect(noPhase[0]?.value).toBeCloseTo(0.5);
		expect(withPhase[0]?.value).toBeCloseTo(1);
	});
});
