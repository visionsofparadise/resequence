import { describe, expect, it } from "vitest";
import { GainEffectNode, gain } from "./gain";
import { pan } from "./pan";

describe("gain", () => {
	it("creates a GainEffectNode instance", () => {
		const fx = gain({ level: -3 });
		expect(fx).toBeInstanceOf(GainEffectNode);
		expect(fx.type).toBe("gain");
	});

	it("accepts optional id", () => {
		const fx = gain({ level: -3, id: "vol" });
		expect(fx.id).toBe("vol");
	});

	it("uses id as effectsId when provided", () => {
		const fx = gain({ level: -3, id: "vol" });
		expect(fx.effectsId).toBe("vol");
	});

	it("generates a unique effectsId when no id provided", () => {
		const fx1 = gain({ level: -3 });
		const fx2 = gain({ level: -3 });
		expect(fx1.effectsId).not.toBe(fx2.effectsId);
	});

	it("to() returns the downstream node", () => {
		const fx = gain({ level: -3 });
		const next = gain({ level: -6 });
		const chained = fx.to(next);
		expect(chained).toBe(next);
	});

	it("to() appends to outputs of the source node", () => {
		const original = gain({ level: -3 });
		const p = pan({ value: 0 });
		original.to(p);
		expect(original.outputs).toHaveLength(1);
		expect(original.outputs[0]).toBe(p);
	});

	it("chains multiple effects serially", () => {
		const g = gain({ level: -3 });
		const p = pan({ value: 0.5 });
		g.to(p);
		expect(g.outputs).toHaveLength(1);
		expect(g.outputs[0]).toBe(p);
	});
});
