import { describe, expect, it } from "vitest";
import { gain, linearGain, lowpass } from "@resequence/sync-units";
import { descendUnits } from "./descendUnits";

describe("descendUnits", () => {
	it("returns target at index without injections", () => {
		const root = gain({ level: 0 });
		const a = lowpass({ frequency: 1000 });
		root.to(a);
		expect(descendUnits(root, 0)).toBe(a);
	});

	it("resolves through injected wrapper at index", () => {
		const root = gain({ level: 0 });
		const wrapper = linearGain({ level: 1 });
		const real = lowpass({ frequency: 1000 });
		wrapper.to(real);
		root.to(wrapper);
		const injected = new WeakSet<object>([wrapper]);
		expect(descendUnits(root, 0, injected)).toBe(real);
	});

	it("returns undefined for out-of-bounds index", () => {
		const root = gain({ level: 0 });
		expect(descendUnits(root, 5)).toBeUndefined();
	});
});
