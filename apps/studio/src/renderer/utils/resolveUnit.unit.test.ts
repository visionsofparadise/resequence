import { gain, linearGain } from "@resequence/web-au";
import { describe, expect, it } from "vitest";
import { resolveUnit } from "./resolveUnit";

describe("resolveUnit", () => {
	it("returns non-injected unit as-is", () => {
		const g = gain({ level: 0 });
		const injected = new WeakSet<object>();
		expect(resolveUnit(g, injected)).toBe(g);
	});

	it("resolves through a single injected wrapper", () => {
		const wrapper = linearGain({ level: 1 });
		const real = gain({ level: 0 });
		wrapper.to(real);
		const injected = new WeakSet<object>([wrapper]);
		expect(resolveUnit(wrapper, injected)).toBe(real);
	});

	it("resolves through chained injected wrappers", () => {
		const wrapper1 = linearGain({ level: 1 });
		const wrapper2 = linearGain({ level: 1 });
		const real = gain({ level: 0 });
		wrapper1.to(wrapper2);
		wrapper2.to(real);
		const injected = new WeakSet<object>([wrapper1, wrapper2]);
		expect(resolveUnit(wrapper1, injected)).toBe(real);
	});

	it("throws if injected node has no target", () => {
		const wrapper = linearGain({ level: 1 });
		const injected = new WeakSet<object>([wrapper]);
		expect(() => resolveUnit(wrapper, injected)).toThrow("Injected unit has no target at index 0");
	});
});
