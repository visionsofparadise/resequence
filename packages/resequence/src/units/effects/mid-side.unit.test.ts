import { describe, expect, it } from "vitest";
import { MidSideEffectUnit, midSide, stereoWidth, width } from "./mid-side";

describe("midSide", () => {
	it("creates a MidSideEffectUnit instance", () => {
		const fx = midSide(0.5);
		expect(fx).toBeInstanceOf(MidSideEffectUnit);
		expect(fx.type).toBe("midSide");
	});

	it("accepts optional id", () => {
		const fx = midSide(0.5, { id: "width" });
		expect(fx.id).toBe("width");
	});

	it("width is an alias for midSide", () => {
		expect(width).toBe(midSide);
	});

	it("stereoWidth is an alias for midSide", () => {
		expect(stereoWidth).toBe(midSide);
	});
});
