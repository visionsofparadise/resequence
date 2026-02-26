import { describe, expect, it } from "vitest";
import { ConvolutionEffectUnit, convolution } from "./convolution";

describe("convolution", () => {
	it("creates a ConvolutionEffectUnit instance", () => {
		const fx = convolution({ impulse: "./ir/hall.wav" });
		expect(fx).toBeInstanceOf(ConvolutionEffectUnit);
	});
});
