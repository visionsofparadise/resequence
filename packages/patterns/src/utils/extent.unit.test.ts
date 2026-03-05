import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { extentOf } from "./extent";

describe("extentOf", () => {
	it("computes bounds from notes", () => {
		const n = note(N.C4, 2);
		const result = extentOf([{ offsetBeats: 1, note: n }], []);
		expect(result.startBeat).toBe(1);
		expect(result.endBeat).toBe(3);
	});

	it("computes bounds from children", () => {
		const child = sequence(N.C4(2));
		const result = extentOf([], [{ offsetBeats: 1, pattern: child }]);
		expect(result.startBeat).toBe(1);
		expect(result.endBeat).toBe(3);
	});

	it("returns 0,0 for empty", () => {
		const result = extentOf([], []);
		expect(result.startBeat).toBe(0);
		expect(result.endBeat).toBe(0);
	});
});
