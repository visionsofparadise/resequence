import { describe, expect, it } from "vitest";
import { formula } from "./formula";
import { bars } from "./duration";

describe("formula", () => {
	it("samples a linear function", () => {
		const points = formula((t) => t, { duration: bars(1), resolution: 4 });
		expect(points).toHaveLength(5);
		expect(points[0]?.value).toBeCloseTo(0);
		expect(points[2]?.value).toBeCloseTo(0.5);
		expect(points[4]?.value).toBeCloseTo(1);
	});

	it("samples a quadratic function", () => {
		const points = formula((t) => t * t, { duration: bars(1), resolution: 4 });
		expect(points[0]?.value).toBeCloseTo(0);
		expect(points[2]?.value).toBeCloseTo(0.25);
		expect(points[4]?.value).toBeCloseTo(1);
	});

	it("samples a constant function", () => {
		const points = formula(() => 0.5, { duration: bars(1), resolution: 4 });
		for (const pt of points) {
			expect(pt.value).toBeCloseTo(0.5);
		}
	});

	it("clamps output values above 1", () => {
		const points = formula(() => 2, { duration: bars(1), resolution: 4 });
		for (const pt of points) {
			expect(pt.value).toBe(1);
		}
	});

	it("clamps output values below 0", () => {
		const points = formula(() => -1, { duration: bars(1), resolution: 4 });
		for (const pt of points) {
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
		const points = formula((t) => t, { duration: bars(1), resolution: 4 });
		for (const pt of points) {
			expect(pt.curve).toBe("linear");
		}
	});

	it("spans the full duration in ticks", () => {
		const points = formula((t) => t, { duration: bars(2), resolution: 4 });
		expect(points[0]?.time).toBe(0);
		expect(points[4]?.time).toBe(bars(2));
	});
});
