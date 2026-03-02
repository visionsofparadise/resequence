import { describe, expect, it } from "vitest";
import { filter } from "../effects/filter";
import { gain } from "../effects/gain";
import { pan } from "../effects/pan";
import { chain } from "./chain";
import { bypass } from "./bypass";

describe("bypass", () => {
	it("captures inner unit's targets", () => {
		const f = filter({ frequency: 1000 });
		const downstream = gain({ level: 0 });
		f.to(downstream);
		const b = bypass(f);
		expect(b.targets).toContain(downstream);
		expect(f.targets).toHaveLength(0);
	});

	it("holds inner unit reference", () => {
		const f = filter({ frequency: 1000 });
		const b = bypass(f);
		expect(b.inner).toBe(f);
	});

	it("captures tail targets from chain composite", () => {
		const g = gain({ level: 0 });
		const f = filter({ frequency: 1000 });
		const c = chain(g, f);
		const downstream = pan({ position: 0 });
		c.to(downstream);
		const b = bypass(c);
		expect(b.targets).toContain(downstream);
	});

	it("forwards MIDI to downstream targets", () => {
		const f = filter({ frequency: 1000 });
		const downstream = gain({ level: 0 });
		f.to(downstream);
		const b = bypass(f);
		expect(b.targets).toContain(downstream);
	});
});
