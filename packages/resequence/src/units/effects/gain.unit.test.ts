import { describe, expect, it } from "vitest";
import { GainEffectUnit, gain } from "./gain";
import { pan } from "./pan";

describe("gain", () => {
	it("creates a GainEffectUnit instance", () => {
		const fx = gain({ level: -3 });
		expect(fx).toBeInstanceOf(GainEffectUnit);
		expect(fx.type).toBe("gain");
	});

	it("accepts optional id", () => {
		const fx = gain({ level: -3, id: "vol" });
		expect(fx.id).toBe("vol");
	});

	it("to() returns the downstream node", () => {
		const fx = gain({ level: -3 });
		const next = gain({ level: -6 });
		const chained = fx.to(next);
		expect(chained).toBe(next);
	});

	it("to() appends to outputs of the source node", () => {
		const original = gain({ level: -3 });
		const p = pan({ position: 0 });
		original.to(p);
		expect(original.targets).toHaveLength(1);
		expect(original.targets[0]).toBe(p);
	});

	it("chains multiple effects serially", () => {
		const g = gain({ level: -3 });
		const p = pan({ position: 0.5 });
		g.to(p);
		expect(g.targets).toHaveLength(1);
		expect(g.targets[0]).toBe(p);
	});
});
