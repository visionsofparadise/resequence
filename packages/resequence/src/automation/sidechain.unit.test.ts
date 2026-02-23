import { describe, expect, it } from "vitest";
import { resolveDuration } from "../utils/duration";
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
		expect(keyframes[0]?.value).toBe(1);
	});

	it("ducks toward 0 on hit", () => {
		const keyframes = sidechain(note("C1", "4n"), { depth: 0.8, attack: 1, release: "8n" });
		expect(keyframes[1]?.value).toBeCloseTo(0.2);
	});

	it("releases back toward 1", () => {
		const keyframes = sidechain(note("C1", "4n"), { depth: 0.8, attack: 1, release: "8n" });
		const releasePoints = keyframes.filter((pt) => resolveDuration(pt.time) > 1 && pt.curve === "linear");
		for (const pt of releasePoints) {
			expect(pt.value).toBeGreaterThan(0.2);
			expect(pt.value).toBeLessThanOrEqual(1);
		}
		const last = releasePoints.at(-1);
		expect(last?.value).toBeCloseTo(1, 3);
	});

	it("returns empty for pattern with no notes", () => {
		expect(sidechain(gap("4n"), { depth: 0.8, attack: 1, release: "8n" })).toEqual([]);
	});

	it("handles depth 1 (full duck to 0)", () => {
		const keyframes = sidechain(note("C1", "4n"), { depth: 1, attack: 1, release: "8n" });
		expect(keyframes[1]?.value).toBeCloseTo(0);
	});
});
