import { describe, expect, it } from "vitest";
import { Router, router } from "./router";

describe("Router", () => {
	it("constructs with defaults", () => {
		const r = new Router();
		expect(r.pattern).toBeUndefined();
		expect(r.ports.size).toBe(0);
	});

	it("constructs with options", () => {
		const pattern = { startBeat: 0, endBeat: 4 } as never;
		const unit = {} as never;
		const r = new Router({ pattern, ports: { drums: unit } });
		expect(r.pattern).toBe(pattern);
		expect(r.ports.get("drums")).toBe(unit);
	});

	it("chains setPattern and route", () => {
		const pattern = { startBeat: 0 } as never;
		const unit = {} as never;
		const r = new Router().setPattern(pattern).route("bass", unit);
		expect(r.pattern).toBe(pattern);
		expect(r.ports.get("bass")).toBe(unit);
	});
});

describe("router factory", () => {
	it("creates a Router instance", () => {
		const r = router();
		expect(r).toBeInstanceOf(Router);
	});

	it("passes options through", () => {
		const pattern = { startBeat: 0 } as never;
		const r = router({ pattern });
		expect(r.pattern).toBe(pattern);
	});
});
