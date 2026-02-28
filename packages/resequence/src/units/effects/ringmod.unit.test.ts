import { describe, expect, it } from "vitest";
import { gain } from "./gain";
import { RingModEffectUnit, ringmod } from "./ringmod";

describe("ringmod", () => {
	it("creates a RingModEffectUnit instance", () => {
		const carrier = gain({ level: 1 });
		const fx = ringmod(carrier);
		expect(fx).toBeInstanceOf(RingModEffectUnit);
		expect(fx.type).toBe("ringmod");
	});
});
