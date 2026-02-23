import { describe, expect, it } from "vitest";
import { invert } from "./invert";
import type { AutomationPoint } from "./patterns/automate";

describe("invert", () => {
	it("flips values (0 becomes 1, 1 becomes 0)", () => {
		const points: Array<AutomationPoint> = [
			{ time: 0, value: 0 },
			{ time: 100, value: 1 },
		];
		const result = invert(points);
		expect(result[0]?.value).toBe(1);
		expect(result[1]?.value).toBe(0);
	});

	it("flips intermediate values", () => {
		const points: Array<AutomationPoint> = [
			{ time: 0, value: 0.3 },
			{ time: 100, value: 0.7 },
		];
		const result = invert(points);
		expect(result[0]?.value).toBeCloseTo(0.7);
		expect(result[1]?.value).toBeCloseTo(0.3);
	});

	it("preserves time", () => {
		const points: Array<AutomationPoint> = [
			{ time: 0, value: 0.5 },
			{ time: 480, value: 0.8 },
		];
		const result = invert(points);
		expect(result[0]?.time).toBe(0);
		expect(result[1]?.time).toBe(480);
	});

	it("preserves curve", () => {
		const points: Array<AutomationPoint> = [
			{ time: 0, value: 0, curve: "step" },
			{ time: 100, value: 1, curve: "linear" },
			{ time: 200, value: 0.5, curve: "exponential" },
		];
		const result = invert(points);
		expect(result[0]?.curve).toBe("step");
		expect(result[1]?.curve).toBe("linear");
		expect(result[2]?.curve).toBe("exponential");
	});

	it("returns empty for empty input", () => {
		expect(invert([])).toEqual([]);
	});
});
