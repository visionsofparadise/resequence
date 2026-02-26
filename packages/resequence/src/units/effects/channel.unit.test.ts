import { describe, expect, it } from "vitest";
import { gain } from "./gain";
import { ChannelEffectUnit, MidEffectUnit, SideEffectUnit, left, mid, right, side } from "./channel";

describe("left", () => {
	it("creates a ChannelEffectUnit", () => {
		const fx = left(gain({ level: -6 }));
		expect(fx).toBeInstanceOf(ChannelEffectUnit);
		expect(fx.type).toBe("channel");
	});
});

describe("right", () => {
	it("creates a ChannelEffectUnit", () => {
		const fx = right(gain({ level: -6 }));
		expect(fx).toBeInstanceOf(ChannelEffectUnit);
		expect(fx.type).toBe("channel");
	});
});

describe("mid", () => {
	it("creates a MidEffectUnit", () => {
		const fx = mid(gain({ level: -3 }));
		expect(fx).toBeInstanceOf(MidEffectUnit);
		expect(fx.type).toBe("mid");
	});
});

describe("side", () => {
	it("creates a SideEffectUnit", () => {
		const fx = side(gain({ level: -3 }));
		expect(fx).toBeInstanceOf(SideEffectUnit);
		expect(fx.type).toBe("side");
	});
});
