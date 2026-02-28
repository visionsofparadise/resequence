import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import { note } from "./note";

describe("NotePattern", () => {
	describe("validation", () => {
		it("rejects velocity below 0", () => {
			expect(() => note(resolvePitch("C4"), resolveDuration("4n"), { velocity: -1 })).toThrow(ResequenceError);
			expect(() => note(resolvePitch("C4"), resolveDuration("4n"), { velocity: -1 })).toThrow("velocity must be 0-127");
		});

		it("rejects velocity above 127", () => {
			expect(() => note(resolvePitch("C4"), resolveDuration("4n"), { velocity: 200 })).toThrow(ResequenceError);
			expect(() => note(resolvePitch("C4"), resolveDuration("4n"), { velocity: 200 })).toThrow("velocity must be 0-127, got 200");
		});

		it("accepts velocity 0", () => {
			expect(note(resolvePitch("C4"), resolveDuration("4n"), { velocity: 0 }).velocity).toBe(0);
		});

		it("accepts velocity 127", () => {
			expect(note(resolvePitch("C4"), resolveDuration("4n"), { velocity: 127 }).velocity).toBe(127);
		});
	});

	describe("durationBeats", () => {
		it("resolves string duration to beats", () => {
			const n = note(resolvePitch("C4"), resolveDuration("4n"));
			expect(n.endBeat - n.startBeat).toBe(1);
		});

		it("resolves numeric duration as-is", () => {
			const n = note(resolvePitch("C4"), 0.5);
			expect(n.endBeat - n.startBeat).toBe(0.5);
		});

		it("resolves dotted duration", () => {
			const n = note(resolvePitch("C4"), resolveDuration("4n."));
			expect(n.endBeat - n.startBeat).toBe(1.5);
		});
	});

	describe("notes", () => {
		it("returns position and pitch", () => {
			const n = note(resolvePitch("C4"), resolveDuration("4n"));
			expect(n).toMatchObject({ startBeat: 0, pitch: resolvePitch("C4") });
		});

		it("handles numeric pitch", () => {
			const n = note(resolvePitch(60), resolveDuration("4n"));
			expect(n).toMatchObject({ startBeat: 0, pitch: resolvePitch(60) });
		});

		it("includes durationBeats and velocity", () => {
			const result = note(resolvePitch("C4"), resolveDuration("4n"), { velocity: 80 });
			expect(result.endBeat - result.startBeat).toBe(1);
			expect(result.velocity).toBe(80);
		});

		it("includes lyric when set", () => {
			const result = note(resolvePitch("C4"), resolveDuration("4n"), { lyric: "hello" });
			expect(result.lyric).toBe("hello");
		});

		it("includes cc when set", () => {
			const result = note(resolvePitch("C4"), resolveDuration("4n"), { cc: { 7: 64, 10: 0 } });
			expect(result.cc).toEqual({ 7: 64, 10: 0 });
		});

		it("cc is undefined when not set", () => {
			const result = note(resolvePitch("C4"), resolveDuration("4n"));
			expect(result.cc).toBeUndefined();
		});
	});
});
