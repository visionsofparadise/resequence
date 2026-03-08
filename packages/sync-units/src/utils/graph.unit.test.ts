import { describe, expect, it } from "vitest";
import { GainEffectUnit } from "../effects/gain";
import { chain } from "../composites/chain";
import { walkUnits, collectUnits, mapUnits, descendUnit } from "./graph";

describe("walkUnits", () => {
	it("visits all units in BFS order", () => {
		const unitA = new GainEffectUnit({ level: 1 });
		const unitB = new GainEffectUnit({ level: 1 });
		const unitC = new GainEffectUnit({ level: 1 });
		unitA.to(unitB);
		unitB.to(unitC);

		const visited: Array<GainEffectUnit> = [];
		walkUnits(unitA, (unit) => { visited.push(unit as GainEffectUnit); });

		expect(visited).toEqual([unitA, unitB, unitC]);
	});

	it("handles fan-out (one → many)", () => {
		const root = new GainEffectUnit({ level: 1 });
		const branchA = new GainEffectUnit({ level: 1 });
		const branchB = new GainEffectUnit({ level: 1 });
		root.to(branchA);
		root.to(branchB);

		const visited: Array<GainEffectUnit> = [];
		walkUnits(root, (unit) => { visited.push(unit as GainEffectUnit); });

		expect(visited).toHaveLength(3);
		expect(visited).toContain(root);
		expect(visited).toContain(branchA);
		expect(visited).toContain(branchB);
	});

	it("avoids revisiting shared nodes", () => {
		const root = new GainEffectUnit({ level: 1 });
		const shared = new GainEffectUnit({ level: 1 });
		const branchA = new GainEffectUnit({ level: 1 });
		const branchB = new GainEffectUnit({ level: 1 });
		root.to(branchA);
		root.to(branchB);
		branchA.to(shared);
		branchB.to(shared);

		const visited: Array<GainEffectUnit> = [];
		walkUnits(root, (unit) => { visited.push(unit as GainEffectUnit); });

		const sharedCount = visited.filter((unit) => unit === shared).length;
		expect(sharedCount).toBe(1);
	});
});

describe("collectUnits", () => {
	it("returns flat list of all units", () => {
		const unitA = new GainEffectUnit({ level: 1 });
		const unitB = new GainEffectUnit({ level: 1 });
		unitA.to(unitB);

		const result = collectUnits(unitA);
		expect(result).toEqual([unitA, unitB]);
	});
});

describe("mapUnits", () => {
	it("replaces units and preserves connections", () => {
		const unitA = new GainEffectUnit({ level: 1, id: "a" });
		const unitB = new GainEffectUnit({ level: 1, id: "b" });
		unitA.to(unitB);

		const replacement = new GainEffectUnit({ level: 0.5, id: "a-replaced" });
		const mapped = mapUnits(unitA, (unit) => (unit === unitA ? replacement : unit));

		expect(mapped).toBe(replacement);
		expect(mapped.targets).toContain(unitB);
	});
});

describe("descendUnit", () => {
	it("navigates to correct unit by index path", () => {
		const unitA = new GainEffectUnit({ level: 1 });
		const unitB = new GainEffectUnit({ level: 1 });
		const unitC = new GainEffectUnit({ level: 1 });
		unitA.to(unitB);
		unitB.to(unitC);

		expect(descendUnit(unitA, [0])).toBe(unitB);
		expect(descendUnit(unitA, [0, 0])).toBe(unitC);
	});

	it("throws on invalid index", () => {
		const unit = new GainEffectUnit({ level: 1 });
		expect(() => descendUnit(unit, [0])).toThrow("No target at index 0");
	});
});
