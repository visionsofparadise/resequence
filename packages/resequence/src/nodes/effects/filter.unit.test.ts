import { describe, expect, it } from "vitest";
import { FilterEffectNode, filter, highpass, lowpass } from "./filter";

describe("filter", () => {
	it("creates a FilterEffectNode with mode and frequency", () => {
		const fx = filter({ mode: "bandpass", frequency: 1000 });
		expect(fx).toBeInstanceOf(FilterEffectNode);
		expect(fx.type).toBe("filter");
	});
});

describe("highpass", () => {
	it("creates a FilterEffectNode with highpass mode", () => {
		const fx = highpass({ frequency: 80 });
		expect(fx).toBeInstanceOf(FilterEffectNode);
		expect(fx.type).toBe("filter");
	});
});

describe("lowpass", () => {
	it("creates a FilterEffectNode with lowpass mode", () => {
		const fx = lowpass({ frequency: 5000 });
		expect(fx).toBeInstanceOf(FilterEffectNode);
		expect(fx.type).toBe("filter");
	});
});
