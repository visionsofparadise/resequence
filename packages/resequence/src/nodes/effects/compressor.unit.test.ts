import { describe, expect, it } from "vitest";
import { CompressorEffectNode, compressor } from "./compressor";

describe("compressor", () => {
	it("creates a CompressorEffectNode instance", () => {
		const fx = compressor({ threshold: -20, ratio: 4 });
		expect(fx).toBeInstanceOf(CompressorEffectNode);
		expect(fx.type).toBe("compressor");
	});
});
