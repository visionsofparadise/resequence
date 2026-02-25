import { describe, expect, it } from "vitest";
import { ConvolutionEffectNode, convolution } from "./convolution";

describe("convolution", () => {
	it("creates a ConvolutionEffectNode instance", () => {
		const fx = convolution({ impulse: "./ir/hall.wav" });
		expect(fx).toBeInstanceOf(ConvolutionEffectNode);
	});
});
