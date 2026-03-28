import { describe, expect, it } from "vitest";
import { Unit } from "./unit";
import type { SetupResult } from "./unit";
import type { UnitContext } from "./context";

class TestUnit extends Unit {
	readonly type = ["unit", "test"] as const;
}

class SetupUnit extends Unit {
	readonly type = ["unit", "setup-test"] as const;
	setupCalled = false;
	teardownCalled = false;

	protected override _setup(_context: UnitContext): SetupResult {
		this.setupCalled = true;
		const node = { connect: () => {}, disconnect: () => {} } as unknown as AudioNode;
		return { entries: [node], exits: [node] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.teardownCalled = true;
	}
}

function mockContext(): UnitContext {
	return {
		audioContext: {} as BaseAudioContext,
		driverMap: new Map(),
		getSample: () => Promise.resolve({} as AudioBuffer),
		loadModule: () => Promise.resolve(),
		latencyBudget: 0,
		basePath: ".",
	};
}

describe("Unit", () => {
	it("is identifiable via static is()", () => {
		const unit = new TestUnit();
		expect(Unit.is(unit)).toBe(true);
		expect(Unit.is({})).toBe(false);
		expect(Unit.is(null)).toBe(false);
	});

	it("has optional id", () => {
		const noId = new TestUnit();
		const withId = new TestUnit({ id: "myUnit" });
		expect(noId.id).toBeUndefined();
		expect(withId.id).toBe("myUnit");
	});

	it("connects units via .to()", () => {
		const unitA = new TestUnit();
		const unitB = new TestUnit();
		unitA.to(unitB);
		expect(unitA.targets).toContain(unitB);
	});

	it("setup guard prevents double setup", () => {
		const unit = new SetupUnit();
		const context = mockContext();
		unit.setup(context);
		unit.setupCalled = false;
		unit.setup(context);
		expect(unit.setupCalled).toBe(false);
	});

	it("teardown clears state", async () => {
		const unit = new SetupUnit();
		const context = mockContext();
		await unit.setup(context);
		expect(unit.entryNodes.length).toBeGreaterThan(0);
		unit.teardown(context);
		expect(unit.entryNodes.length).toBe(0);
		expect(unit.exitNodes.length).toBe(0);
		expect(unit.teardownCalled).toBe(true);
	});

	it("registers mod declarations", () => {
		const unit = new TestUnit();
		unit.mod(["path.a", "path.b"]);
		expect(unit.properties.modDeclarations).toHaveLength(1);
		expect(unit.properties.modDeclarations[0]?.paths).toEqual(["path.a", "path.b"]);
	});

});
