import { describe, expect, it } from "vitest";
import { CompressorEffectUnit, compressor } from "./compressor";

describe("compressor", () => {
	it("creates a CompressorEffectUnit instance", () => {
		const fx = compressor({ threshold: -20, ratio: 4 });
		expect(fx).toBeInstanceOf(CompressorEffectUnit);
		expect(fx.type).toBe("compressor");
	});
});
