import { describe, expect, it } from "vitest";
import { PanEffectNode, pan } from "./pan";

describe("pan", () => {
	it("creates a PanEffectNode instance", () => {
		const fx = pan({ value: 0.5 });
		expect(fx).toBeInstanceOf(PanEffectNode);
		expect(fx.type).toBe("pan");
	});
});
