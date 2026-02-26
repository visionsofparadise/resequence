import { describe, expect, it } from "vitest";
import { gain } from "./gain";
import { AmEffectUnit, am } from "./am";

describe("am", () => {
	it("creates an AmEffectUnit instance", () => {
		const carrier = gain({ level: 1 });
		const fx = am(carrier);
		expect(fx).toBeInstanceOf(AmEffectUnit);
		expect(fx.type).toBe("am");
	});

	it("collects sample keys from carrier", () => {
		const carrier = gain({ level: 1 });
		const fx = am(carrier);
		const keys = fx.collectSampleKeys();
		expect(keys).toBeInstanceOf(Set);
	});
});
