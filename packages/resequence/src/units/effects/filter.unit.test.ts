import { describe, expect, it } from "vitest";
import { FilterEffectUnit, filter, highpass, lowpass } from "./filter";

describe("filter", () => {
	it("creates a FilterEffectUnit with mode and frequency", () => {
		const fx = filter({ mode: "bandpass", frequency: 1000 });
		expect(fx).toBeInstanceOf(FilterEffectUnit);
		expect(fx.type).toBe("filter");
	});
});

describe("highpass", () => {
	it("creates a FilterEffectUnit with highpass mode", () => {
		const fx = highpass({ frequency: 80 });
		expect(fx).toBeInstanceOf(FilterEffectUnit);
		expect(fx.type).toBe("filter");
	});
});

describe("lowpass", () => {
	it("creates a FilterEffectUnit with lowpass mode", () => {
		const fx = lowpass({ frequency: 5000 });
		expect(fx).toBeInstanceOf(FilterEffectUnit);
		expect(fx.type).toBe("filter");
	});
});
