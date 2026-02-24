import { describe, expect, it } from "vitest";
import { CC } from "./cc";

describe("CC", () => {
	it("has correct MIDI CC numbers", () => {
		expect(CC.MODULATION).toBe(1);
		expect(CC.VOLUME).toBe(7);
		expect(CC.PAN).toBe(10);
		expect(CC.EXPRESSION).toBe(11);
		expect(CC.SUSTAIN).toBe(64);
		expect(CC.RESONANCE).toBe(71);
		expect(CC.RELEASE).toBe(72);
		expect(CC.ATTACK).toBe(73);
		expect(CC.CUTOFF).toBe(74);
		expect(CC.REVERB).toBe(91);
		expect(CC.CHORUS).toBe(93);
	});
});
