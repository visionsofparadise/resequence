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

	describe("durationBeats", () => {
		it("resolves string duration to beats", () => {
			const n = N.C4(1);
			expect(n.endBeat - n.startBeat).toBe(1);
		});

		it("resolves numeric duration as-is", () => {
			const n = N.C4(0.5);
			expect(n.endBeat - n.startBeat).toBe(0.5);
		});

		it("resolves dotted duration", () => {
			const n = N.C4(1.5);
			expect(n.endBeat - n.startBeat).toBe(1.5);
		});
	});

	describe("notes", () => {
		it("returns position and pitch", () => {
			const n = N.C4(1);
			expect(n).toMatchObject({ startBeat: 0, pitch: N.C4 });
		});

		it("handles numeric pitch", () => {
			const n = N.C4(1);
			expect(n).toMatchObject({ startBeat: 0, pitch: N.C4 });
		});

		it("includes durationBeats and velocity", () => {
			const result = N.C4(1, { velocity: 80 });
			expect(result.endBeat - result.startBeat).toBe(1);
			expect(result.velocity).toBe(80);
		});

		it("includes lyric when set", () => {
			const result = N.C4(1, { lyric: "hello" });
			expect(result.lyric).toBe("hello");
		});

		it("includes cc when set", () => {
			const result = N.C4(1, { cc: { 7: 64, 10: 0 } });
			expect(result.cc).toEqual({ 7: 64, 10: 0 });
		});

		it("cc is undefined when not set", () => {
			const result = N.C4(1);
			expect(result.cc).toBeUndefined();
		});
	});
});
