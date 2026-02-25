import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { note } from "./note";

describe("NotePattern", () => {
	describe("validation", () => {
		it("rejects velocity below 0", () => {
			expect(() => note("C4", "4n", { velocity: -1 })).toThrow(ResequenceError);
			expect(() => note("C4", "4n", { velocity: -1 })).toThrow("velocity must be 0-127");
		});

		it("rejects velocity above 127", () => {
			expect(() => note("C4", "4n", { velocity: 200 })).toThrow(ResequenceError);
			expect(() => note("C4", "4n", { velocity: 200 })).toThrow("velocity must be 0-127, got 200");
		});

		it("accepts velocity 0", () => {
			expect(note("C4", "4n", { velocity: 0 }).velocity).toBe(0);
		});

		it("accepts velocity 127", () => {
			expect(note("C4", "4n", { velocity: 127 }).velocity).toBe(127);
		});
	});

	describe("durationTicks", () => {
		it("resolves string duration to ticks", () => {
			expect(note("C4", "4n").durationTicks).toBe(480);
		});

		it("resolves numeric duration as-is", () => {
			expect(note("C4", 240).durationTicks).toBe(240);
		});

		it("resolves dotted duration", () => {
			expect(note("C4", "4n.").durationTicks).toBe(720);
		});
	});

	describe("notes", () => {
		it("returns position and pitch", () => {
			expect(note("C4", "4n").notes).toMatchObject([{ tick: 0, pitch: 60 }]);
		});

		it("handles numeric pitch", () => {
			expect(note(60, "4n").notes).toMatchObject([{ tick: 0, pitch: 60 }]);
		});

		it("includes durationTicks and velocity", () => {
			const result = note("C4", "4n", { velocity: 80 }).notes;
			expect(result[0]!.durationTicks).toBe(480);
			expect(result[0]!.velocity).toBe(80);
		});

		it("includes lyric when set", () => {
			const result = note("C4", "4n", { lyric: "hello" }).notes;
			expect(result[0]!.lyric).toBe("hello");
		});

		it("includes cc when set", () => {
			const result = note("C4", "4n", { cc: { 7: 64, 10: 0 } }).notes;
			expect(result[0]!.cc).toEqual({ 7: 64, 10: 0 });
		});

		it("cc is undefined when not set", () => {
			const result = note("C4", "4n").notes;
			expect(result[0]!.cc).toBeUndefined();
		});
	});
});
