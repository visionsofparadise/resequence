import { describe, expect, it } from "vitest";
import { bars, ms, sec } from "./duration";

describe("bars", () => {
	it("returns beats for n bars at 4/4", () => {
		expect(bars(1)).toBe(4);
		expect(bars(2)).toBe(8);
		expect(bars(4)).toBe(16);
	});

	it("respects time signature", () => {
		expect(bars(1, [7, 8])).toBe(3.5);
		expect(bars(2, [3, 4])).toBe(6);
	});
});

describe("ms", () => {
	it("converts milliseconds to beats", () => {
		expect(ms(500, 120)).toBe(1);
		expect(ms(250, 120)).toBe(0.5);
	});
});

describe("sec", () => {
	it("converts seconds to beats", () => {
		expect(sec(1, 120)).toBe(2);
	});
});

