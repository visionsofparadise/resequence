import { describe, expect, it } from "vitest";
import { ReverbEffectNode, reverb } from "./reverb";

describe("reverb", () => {
	it("creates a ReverbEffectNode instance", () => {
		const fx = reverb({ impulse: "./ir/hall.wav" });
		expect(fx).toBeInstanceOf(ReverbEffectNode);
	});
});
