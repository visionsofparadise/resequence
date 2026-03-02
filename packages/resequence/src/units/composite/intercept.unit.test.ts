import { describe, expect, it } from "vitest";
import { compressor } from "../effects/compressor";
import { filter } from "../effects/filter";
import { gain } from "../effects/gain";
import { intercept } from "./intercept";

describe("intercept", () => {
	it("captures inner unit's targets", () => {
		const f = filter({ id: "lpf", frequency: 1000 });
		const downstream = gain({ level: 0 });
		f.to(downstream);
		const i = intercept(f, { override: { frequency: 0.5 } });
		expect(i.targets).toContain(downstream);
		expect(f.targets).toHaveLength(0);
	});

	it("holds inner unit reference", () => {
		const f = filter({ id: "lpf", frequency: 1000 });
		const i = intercept(f, {});
		expect(i.inner).toBe(f);
	});

	it("stores insert units", () => {
		const f = filter({ id: "lpf", frequency: 1000 });
		const comp = compressor({ threshold: -20 });
		const i = intercept(f, { insert: [comp] });
		expect(i.inner).toBe(f);
	});

	it("works with no options", () => {
		const f = filter({ frequency: 1000 });
		const i = intercept(f, {});
		expect(i.inner).toBe(f);
	});
});
