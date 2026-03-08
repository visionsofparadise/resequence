import { describe, expect, it } from "vitest";
import { gain, linearGain, lowpass } from "@resequence/sync-units";
import { walkUnits } from "./walkUnits";

describe("walkUnits", () => {
	it("walks graph without injections (backwards compatible)", () => {
		const root = gain({ level: 0 });
		const a = lowpass({ frequency: 1000 });
		const b = gain({ level: -3 });
		root.to(a);
		root.to(b);
		const visited: string[] = [];
		walkUnits(root, (unit, index) => visited.push(`${index}:${unit.type[1]}`));
		expect(visited).toEqual(["0:filter", "1:gain"]);
	});

	it("resolves through injected wrappers", () => {
		const root = gain({ level: 0 });
		const wrapper = linearGain({ level: 1 });
		const real = lowpass({ frequency: 1000 });
		wrapper.to(real);
		root.to(wrapper);
		const injected = new WeakSet<object>([wrapper]);
		const visited: string[] = [];
		walkUnits(root, (unit, index) => visited.push(`${index}:${unit.type[1]}`), new WeakSet(), injected);
		expect(visited).toEqual(["0:filter"]);
	});

	it("preserves index when resolving injected wrapper", () => {
		const root = gain({ level: 0 });
		const a = lowpass({ frequency: 1000 });
		const wrapper = linearGain({ level: 1 });
		const b = gain({ level: -3 });
		wrapper.to(b);
		root.to(a);
		root.to(wrapper);
		const injected = new WeakSet<object>([wrapper]);
		const visited: [number, string][] = [];
		walkUnits(root, (unit, index) => visited.push([index, unit.type[1] as string]), new WeakSet(), injected);
		expect(visited).toEqual([[0, "filter"], [1, "gain"]]);
	});
});
