import { describe, expect, it } from "vitest";
import type { Keyframe } from "../patterns/automate";
import { invert } from "./invert";

describe("invert", () => {
	it("flips values (0 becomes 1, 1 becomes 0)", () => {
		const keyframes: Array<Keyframe> = [
			{ time: 0, value: 0 },
			{ time: 100, value: 1 },
		];
		const result = invert(keyframes);
		expect(result[0]?.value).toBe(1);
		expect(result[1]?.value).toBe(0);
	});

	it("returns empty for empty input", () => {
		expect(invert([])).toEqual([]);
	});
});
