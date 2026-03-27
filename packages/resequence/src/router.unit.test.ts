import { sequence } from "@resequence/patterns";
import type { MidiUnit } from "@resequence/web-au";
import { describe, expect, it } from "vitest";
import { Playback } from "./playback";
import { Router, router } from "./router";

function createMockUnit(): MidiUnit {
	return {
		type: ["unit", "midi", "mock"],
		setup: () => {},
		teardown: () => {},
		schedule: () => {},
	} as unknown as MidiUnit;
}

describe("Router", () => {
	describe("Router.is()", () => {
		it("returns true for Router instances", () => {
			const instance = new Router(sequence(), {});
			expect(Router.is(instance)).toBe(true);
		});

		it("returns false for null", () => {
			expect(Router.is(null)).toBe(false);
		});

		it("returns false for undefined", () => {
			expect(Router.is(undefined)).toBe(false);
		});

		it("returns false for plain objects", () => {
			expect(Router.is({ type: "not-a-router" })).toBe(false);
		});

		it("returns false for objects with non-array type", () => {
			expect(Router.is({ type: "router" })).toBe(false);
		});

		it("returns false for objects with wrong type array", () => {
			expect(Router.is({ type: ["sequence"] })).toBe(false);
		});

		it("returns true for duck-typed objects with matching type", () => {
			expect(Router.is({ type: ["router"] })).toBe(true);
		});
	});

	describe("type", () => {
		it('equals ["router"]', () => {
			const instance = new Router(sequence(), {});
			expect(instance.type).toEqual(["router"]);
		});
	});

	describe("pattern", () => {
		it("returns the provided pattern", () => {
			const pattern = sequence();
			const instance = new Router(pattern, {});
			expect(instance.pattern).toBe(pattern);
		});
	});

	describe("ports", () => {
		it("returns a ReadonlyMap with provided port mappings", () => {
			const bass = createMockUnit();
			const drums = createMockUnit();
			const instance = new Router(sequence(), { bass, drums });

			expect(instance.ports).toBeInstanceOf(Map);
			expect(instance.ports.size).toBe(2);
			expect(instance.ports.get("bass")).toBe(bass);
			expect(instance.ports.get("drums")).toBe(drums);
		});

		it("returns an empty map when no ports provided", () => {
			const instance = new Router(sequence(), {});
			expect(instance.ports.size).toBe(0);
		});
	});

	describe("router() factory", () => {
		it("creates a Router instance", () => {
			const instance = router(sequence(), {});
			expect(Router.is(instance)).toBe(true);
			expect(instance).toBeInstanceOf(Router);
		});

		it("passes pattern and ports to the Router", () => {
			const pattern = sequence();
			const unit = createMockUnit();
			const instance = router(pattern, { lead: unit });

			expect(instance.pattern).toBe(pattern);
			expect(instance.ports.get("lead")).toBe(unit);
		});
	});

	describe("play()", () => {
		it("returns a Playback instance", () => {
			const instance = new Router(sequence(), {});
			const playback = instance.play({} as AudioContext);
			expect(playback).toBeInstanceOf(Playback);
		});
	});
});
