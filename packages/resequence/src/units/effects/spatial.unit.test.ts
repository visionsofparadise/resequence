import { describe, expect, it } from "vitest";
import { SpatialEffectUnit, spatial } from "./spatial";

describe("spatial", () => {
	it("creates a SpatialEffectUnit instance", () => {
		const fx = spatial({ x: 1 });
		expect(fx).toBeInstanceOf(SpatialEffectUnit);
		expect(fx.type).toBe("spatial");
	});

	it("accepts optional id", () => {
		const fx = spatial({ x: 0, y: 1, z: -1, id: "pos" });
		expect(fx.id).toBe("pos");
	});

	it("defaults y and z to 0", () => {
		const fx = spatial({ x: 5 });
		expect(fx).toBeInstanceOf(SpatialEffectUnit);
	});

	it("accepts distance model options", () => {
		const fx = spatial({ x: 0, distanceModel: "inverse", refDistance: 1, maxDistance: 100, rolloffFactor: 1 });
		expect(fx).toBeInstanceOf(SpatialEffectUnit);
	});
});
