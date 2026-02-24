import { describe, expect, it } from "vitest";
import { DelayEffectNode, delay } from "./delay";

describe("delay", () => {
	it("creates a DelayEffectNode instance", () => {
		const fx = delay({ time: 0.5 });
		expect(fx).toBeInstanceOf(DelayEffectNode);
	});
});
