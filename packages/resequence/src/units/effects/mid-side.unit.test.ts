import { describe, expect, it } from "vitest";
import { Fan } from "../composite/fan";
import { midSide, stereoWidth, width } from "./mid-side";

describe("midSide", () => {
	it("creates a Fan instance", () => {
		const fx = midSide(0.5);
		expect(fx).toBeInstanceOf(Fan);
	});

	it("width is an alias for midSide", () => {
		expect(width).toBe(midSide);
	});

	it("stereoWidth is an alias for midSide", () => {
		expect(stereoWidth).toBe(midSide);
	});
});
