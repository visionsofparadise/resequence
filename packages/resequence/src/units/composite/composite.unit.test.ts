import { describe, expect, it } from "vitest";
import { filter } from "../effects/filter";
import { gain } from "../effects/gain";
import { pan } from "../effects/pan";
import { Chain, chain } from "./chain";
import { Composite } from "./composite";
import { Fan, fan } from "./fan";

describe("chain", () => {
	it("returns a Chain instance", () => {
		const c = chain(gain({ level: 0 }), filter({ frequency: 1000 }));
		expect(c).toBeInstanceOf(Chain);
		expect(c).toBeInstanceOf(Composite);
	});

	it("sets head to first unit and tail to last unit", () => {
		const g = gain({ level: 0 });
		const f = filter({ frequency: 1000 });
		const p = pan({ position: 0 });
		const c = chain(g, f, p);
		expect(c.head).toBe(g);
		expect(c.tail).toBe(p);
	});

	it("wires units serially via targets", () => {
		const g = gain({ level: 0 });
		const f = filter({ frequency: 1000 });
		const p = pan({ position: 0 });
		chain(g, f, p);
		expect(g.targets).toContain(f);
		expect(f.targets).toContain(p);
	});

	it("collects all units in order", () => {
		const g = gain({ level: 0 });
		const f = filter({ frequency: 1000 });
		const p = pan({ position: 0 });
		const c = chain(g, f, p);
		expect(c.units).toEqual([g, f, p]);
	});

	it("delegates to() to tail", () => {
		const g = gain({ level: 0 });
		const f = filter({ frequency: 1000 });
		const c = chain(g, f);
		const downstream = pan({ position: 0 });
		c.to(downstream);
		expect(f.targets).toContain(downstream);
	});

	it("flattens nested chains in units", () => {
		const a = gain({ level: 0 });
		const b = filter({ frequency: 1000 });
		const inner = chain(a, b);
		const c = pan({ position: 0 });
		const outer = chain(inner, c);
		expect(outer.units).toEqual([a, b, c]);
	});

	it("nested chain head is first flattened unit", () => {
		const a = gain({ level: 0 });
		const b = filter({ frequency: 1000 });
		const inner = chain(a, b);
		const c = pan({ position: 0 });
		const outer = chain(inner, c);
		expect(outer.head).toBe(a);
		expect(outer.tail).toBe(c);
	});

	it("nested chain wiring connects inner tail to next unit", () => {
		const a = gain({ level: 0 });
		const b = filter({ frequency: 1000 });
		const inner = chain(a, b);
		const c = pan({ position: 0 });
		chain(inner, c);
		expect(b.targets).toContain(c);
	});
});

describe("fan", () => {
	it("returns a Fan instance", () => {
		const f = fan(gain({ level: 0 }), filter({ frequency: 1000 }));
		expect(f).toBeInstanceOf(Fan);
		expect(f).toBeInstanceOf(Composite);
	});

	it("creates a gain node as head", () => {
		const f = fan(gain({ level: 0 }), filter({ frequency: 1000 }));
		expect(f.head).toBeDefined();
		expect(f.head.targets).toHaveLength(2);
	});

	it("wires head to all branches", () => {
		const g = gain({ level: 0 });
		const fi = filter({ frequency: 1000 });
		const f = fan(g, fi);
		expect(f.head.targets).toContain(g);
		expect(f.head.targets).toContain(fi);
	});

	it("stores branches as tails", () => {
		const g = gain({ level: 0 });
		const fi = filter({ frequency: 1000 });
		const f = fan(g, fi);
		expect(f.tails).toEqual([g, fi]);
	});

	it("delegates to() to all tails", () => {
		const g = gain({ level: 0 });
		const fi = filter({ frequency: 1000 });
		const f = fan(g, fi);
		const downstream = pan({ position: 0 });
		f.to(downstream);
		expect(g.targets).toContain(downstream);
		expect(fi.targets).toContain(downstream);
	});

	it("includes head and flattened branches in units", () => {
		const g = gain({ level: 0 });
		const fi = filter({ frequency: 1000 });
		const f = fan(g, fi);
		expect(f.units[0]).toBe(f.head);
		expect(f.units).toContain(g);
		expect(f.units).toContain(fi);
	});
});
