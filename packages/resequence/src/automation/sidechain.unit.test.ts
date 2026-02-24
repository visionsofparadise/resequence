import { describe, expect, it } from "vitest";
import type { CurveKeyframe } from "../patterns/automate";
import { gap } from "../patterns/gap";
import { note } from "../patterns/note";
import { repeat } from "../patterns/repeat";
import { invert } from "./invert";
import { sidechain } from "./sidechain";
import { trigger } from "./trigger";

describe("sidechain", () => {
	it("equals invert(trigger(...)) for same inputs", () => {
		const pattern = repeat(note("C1", "4n"), 4);
		const options = { depth: 0.8, attack: 1 as const, release: "8n" as const, tension: 1 };
		const triggerOptions = { peak: 0.8, attack: 1 as const, release: "8n" as const, tension: 1 };

		const sidechainResult = sidechain(pattern, options);
		const expectedResult = invert(trigger(pattern, triggerOptions));

		expect(sidechainResult).toEqual(expectedResult);
	});

	it("starts at 1 (full volume)", () => {
		const keyframes = sidechain(note("C1", "4n"), { depth: 0.8, attack: 1, release: "8n" });
		const first = keyframes[0];
		expect("value" in first! && first.value).toBe(1);
	});

	it("ducks toward 0 on hit", () => {
		const keyframes = sidechain(note("C1", "4n"), { depth: 0.8, attack: 1, release: "8n" });
		const second = keyframes[1];
		expect("value" in second! && second.value).toBeCloseTo(0.2);
	});

	it("release curve ends near 1", () => {
		const keyframes = sidechain(note("C1", "4n"), { depth: 0.8, attack: 1, release: "8n" });
		const curve = keyframes[2] as CurveKeyframe;
		expect("values" in curve).toBe(true);
		const lastValue = curve.values[curve.values.length - 1];
		expect(lastValue).toBeGreaterThan(0.99);
	});

	it("release curve values are all between 0.2 and 1", () => {
		const keyframes = sidechain(note("C1", "4n"), { depth: 0.8, attack: 1, release: "8n" });
		const curve = keyframes[2] as CurveKeyframe;
		for (const value of curve.values) {
			expect(value).toBeGreaterThanOrEqual(0.2 - 1e-6);
			expect(value).toBeLessThanOrEqual(1);
		}
	});

	it("returns empty for pattern with no notes", () => {
		expect(sidechain(gap("4n"), { depth: 0.8, attack: 1, release: "8n" })).toEqual([]);
	});

	it("handles depth 1 (full duck to 0)", () => {
		const keyframes = sidechain(note("C1", "4n"), { depth: 1, attack: 1, release: "8n" });
		const second = keyframes[1];
		expect("value" in second! && second.value).toBeCloseTo(0);
	});
});
