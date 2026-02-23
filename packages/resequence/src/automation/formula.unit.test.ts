import { describe, expect, it } from "vitest";
import { bars } from "../utils/duration";
import { formula } from "./formula";

describe("formula", () => {
	it("samples a linear function", () => {
		const keyframes = formula((t) => t, { duration: bars(1), resolution: 4 });
		expect(keyframes).toHaveLength(5);
		expect(keyframes[0]?.value).toBeCloseTo(0);
		expect(keyframes[2]?.value).toBeCloseTo(0.5);
		expect(keyframes[4]?.value).toBeCloseTo(1);
	});

	it("samples a quadratic function", () => {
		const keyframes = formula((t) => t * t, { duration: bars(1), resolution: 4 });
		expect(keyframes[0]?.value).toBeCloseTo(0);
		expect(keyframes[2]?.value).toBeCloseTo(0.25);
		expect(keyframes[4]?.value).toBeCloseTo(1);
	});

	it("samples a constant function", () => {
		const keyframes = formula(() => 0.5, { duration: bars(1), resolution: 4 });
		for (const pt of keyframes) {
			expect(pt.value).toBeCloseTo(0.5);
		}
	});

	it("clamps output values above 1", () => {
		const keyframes = formula(() => 2, { duration: bars(1), resolution: 4 });
		for (const pt of keyframes) {
			expect(pt.value).toBe(1);
		}
	});

	it("clamps output values below 0", () => {
		const keyframes = formula(() => -1, { duration: bars(1), resolution: 4 });
		for (const pt of keyframes) {
			expect(pt.value).toBe(0);
		}
	});

	it("resolution controls point density", () => {
		const low = formula((t) => t, { duration: bars(1), resolution: 4 });
		const high = formula((t) => t, { duration: bars(1), resolution: 16 });
		expect(low).toHaveLength(5);
		expect(high).toHaveLength(17);
	});

	it("uses linear curves", () => {
		const keyframes = formula((t) => t, { duration: bars(1), resolution: 4 });
		for (const pt of keyframes) {
			expect(pt.curve).toBe("linear");
		}
	});

	it("spans the full duration in ticks", () => {
		const keyframes = formula((t) => t, { duration: bars(2), resolution: 4 });
		expect(keyframes[0]?.time).toBe(0);
		expect(keyframes[4]?.time).toBe(bars(2));
	});
});
