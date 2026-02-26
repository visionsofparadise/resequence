import { describe, expect, it } from "vitest";
import { PanEffectUnit, pan } from "./pan";

describe("pan", () => {
	it("creates a PanEffectUnit instance", () => {
		const fx = pan({ position: 0.5 });
		expect(fx).toBeInstanceOf(PanEffectUnit);
		expect(fx.type).toBe("pan");
	});
});
