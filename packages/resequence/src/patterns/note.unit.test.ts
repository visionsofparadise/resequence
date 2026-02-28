import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { N } from "../tunings/chromatic";

describe("NotePattern", () => {
	describe("validation", () => {
		it("rejects velocity below 0", () => {
			expect(() => N.C4(1, { velocity: -1 })).toThrow(ResequenceError);
			expect(() => N.C4(1, { velocity: -1 })).toThrow("velocity must be 0-127");
		});

		it("rejects velocity above 127", () => {
			expect(() => N.C4(1, { velocity: 200 })).toThrow(ResequenceError);
			expect(() => N.C4(1, { velocity: 200 })).toThrow("velocity must be 0-127, got 200");
		});

		it("accepts velocity 0", () => {
			expect(N.C4(1, { velocity: 0 }).velocity).toBe(0);
		});

		it("accepts velocity 127", () => {
			expect(N.C4(1, { velocity: 127 }).velocity).toBe(127);
		});
	});

	it("creates note with duration and pitch", () => {
		const n = N.C4(1);
		expect(n.endBeat - n.startBeat).toBe(1);
		expect(n).toMatchObject({ startBeat: 0, pitch: N.C4 });
	});

	it("applies non-default velocity", () => {
		const result = N.C4(1, { velocity: 80 });
		expect(result.velocity).toBe(80);
	});
});
