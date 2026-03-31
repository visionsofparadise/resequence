import { describe, expect, it } from "vitest";
import { gap } from "./gap";

describe("gap", () => {
	it("creates a pattern with correct duration", () => {
		const g = gap(4);
		expect(g.startBeat).toBe(0);
		expect(g.endBeat).toBe(4);
		expect(g.notes).toHaveLength(0);
		expect(g.children).toHaveLength(0);
	});

	it("has correct packageName and unitName", () => {
		const g = gap(2);
		expect(g.packageName).toBe("@resequence/patterns-core");
		expect(g.unitName).toBe("gap");
	});

	it("stores duration in properties", () => {
		const g = gap(8);
		expect(g.properties.duration).toBe(8);
	});
});
