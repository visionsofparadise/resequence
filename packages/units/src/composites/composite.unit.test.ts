import { describe, expect, it } from "vitest";
import { GainEffectUnit } from "../effects/gain";
import { chain } from "./chain";
import { fan } from "./fan";

describe("chain", () => {
	it("sets head to first unit and tail to last unit", () => {
		const unitA = new GainEffectUnit({ level: 1 });
		const unitB = new GainEffectUnit({ level: 1 });
		const unitC = new GainEffectUnit({ level: 1 });
		const composite = chain(unitA, unitB, unitC);
		expect(composite.head).toBe(unitA);
		expect(composite.tail).toBe(unitC);
	});

	it("wires units serially via targets", () => {
		const unitA = new GainEffectUnit({ level: 1 });
		const unitB = new GainEffectUnit({ level: 1 });
		const unitC = new GainEffectUnit({ level: 1 });
		chain(unitA, unitB, unitC);
		expect(unitA.targets).toContain(unitB);
		expect(unitB.targets).toContain(unitC);
	});

	it("flattens nested chains", () => {
		const unitA = new GainEffectUnit({ level: 1 });
		const unitB = new GainEffectUnit({ level: 1 });
		const unitC = new GainEffectUnit({ level: 1 });
		const inner = chain(unitA, unitB);
		const outer = chain(inner, unitC);
		expect(outer.units).toHaveLength(3);
	});

	it("routes .to() through the tail", () => {
		const unitA = new GainEffectUnit({ level: 1 });
		const unitB = new GainEffectUnit({ level: 1 });
		const target = new GainEffectUnit({ level: 1 });
		const composite = chain(unitA, unitB);
		composite.to(target);
		expect(unitB.targets).toContain(target);
	});
});

describe("fan", () => {
	it("creates a hidden head with all branches as targets", () => {
		const branchA = new GainEffectUnit({ level: 1 });
		const branchB = new GainEffectUnit({ level: 1 });
		const composite = fan(branchA, branchB);
		expect(composite.head.targets).toContain(branchA);
		expect(composite.head.targets).toContain(branchB);
	});

	it("routes .to() through all tails", () => {
		const branchA = new GainEffectUnit({ level: 1 });
		const branchB = new GainEffectUnit({ level: 1 });
		const target = new GainEffectUnit({ level: 1 });
		const composite = fan(branchA, branchB);
		composite.to(target);
		expect(branchA.targets).toContain(target);
		expect(branchB.targets).toContain(target);
	});
});
