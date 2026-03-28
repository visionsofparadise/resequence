import { describe, expect, it } from "vitest";
import { layer, N, sequence } from "@resequence/patterns-core";
import { validate } from "./validate";

describe("validate", () => {
	it("reports orphaned notes with no port routing", () => {
		const pat = sequence(N.C4(1), N.E4(1));
		const warnings = validate(pat);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]!.code).toBe("ORPHANED_NOTES");
	});

	it("passes when pattern has port routing", () => {
		const pat = sequence(N.C4(1), N.E4(1)).route("piano");
		const warnings = validate(pat);
		expect(warnings).toHaveLength(0);
	});

	it("inherits port routing from parent", () => {
		const child = sequence(N.C4(1));
		const parent = layer(child).route("piano");
		const warnings = validate(parent);
		expect(warnings).toHaveLength(0);
	});

	it("reports deeply nested orphaned notes", () => {
		const inner = sequence(N.C4(1));
		const outer = layer(inner);
		const warnings = validate(outer);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]!.path).toEqual([0]);
	});

	it("passes with no notes", () => {
		const pat = sequence();
		const warnings = validate(pat);
		expect(warnings).toHaveLength(0);
	});
});
