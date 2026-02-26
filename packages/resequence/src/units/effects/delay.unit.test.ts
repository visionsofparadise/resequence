import { describe, expect, it } from "vitest";
import { DelayEffectUnit, delay } from "./delay";

describe("delay", () => {
	it("creates a DelayEffectUnit instance", () => {
		const fx = delay({ time: 0.5 });
		expect(fx).toBeInstanceOf(DelayEffectUnit);
	});
});
