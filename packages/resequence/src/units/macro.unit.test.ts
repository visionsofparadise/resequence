import { describe, expect, it } from "vitest";
import { MacroUnit, macro } from "./macro";

describe("macro", () => {
	it("creates a MacroUnit instance", () => {
		const m = macro(0.5, { id: "macro-1" });
		expect(m).toBeInstanceOf(MacroUnit);
		expect(m.type).toBe("macro");
	});

	it("requires an id", () => {
		const m = macro(0.5, { id: "ctrl" });
		expect(m.id).toBe("ctrl");
	});

	it("does not have entry nodes before setup", () => {
		const m = macro(0.7, { id: "m1" });
		expect(m.entryNodes).toHaveLength(0);
	});
});
