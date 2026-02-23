import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { note, NotePattern } from "./note";

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

	describe("transpose", () => {
		it("transposes a single note up", () => {
			const result = note("C4", "4n").transpose(7) as NotePattern;
			expect(result.type).toBe("note");
			expect(result.pitch).toBe(67);
		});

		it("transposes a single note down", () => {
			const result = note("C4", "4n").transpose(-12) as NotePattern;
			expect(result.pitch).toBe(48);
		});

		it("transposes numeric pitch", () => {
			const result = note(60, "4n").transpose(5) as NotePattern;
			expect(result.pitch).toBe(65);
		});

		it("preserves velocity", () => {
			const result = note("C4", "4n", { velocity: 80 }).transpose(3) as NotePattern;
			expect(result.velocity).toBe(80);
		});

		it("preserves lyric", () => {
			const result = note("C4", "4n", { lyric: "hel" }).transpose(3) as NotePattern;
			expect(result.lyric).toBe("hel");
		});

		it("preserves duration", () => {
			const result = note("C4", "2n").transpose(3) as NotePattern;
			expect(result.duration).toBe("2n");
		});

		it("handles negative intervals", () => {
			const result = note("C4", "4n").transpose(-3) as NotePattern;
			expect(result.pitch).toBe(57);
		});

		it("handles zero interval", () => {
			const result = note("C4", "4n").transpose(0) as NotePattern;
			expect(result.pitch).toBe(60);
		});
	});

	describe("reverse", () => {
		it("returns note unchanged", () => {
			const result = note("C4", "4n", { velocity: 80, lyric: "hel" }).reverse() as NotePattern;
			expect(result.type).toBe("note");
			expect(result.pitch).toBe("C4");
			expect(result.duration).toBe("4n");
			expect(result.velocity).toBe(80);
			expect(result.lyric).toBe("hel");
		});
	});

	describe("getMidi", () => {
		it("returns position and pitch", () => {
			expect(note("C4", "4n").getMidi()).toMatchObject([{ tick: 0, pitch: 60 }]);
		});

		it("applies offset", () => {
			expect(note("C4", "4n").getMidi(100)).toMatchObject([{ tick: 100, pitch: 60 }]);
		});

		it("handles numeric pitch", () => {
			expect(note(60, "4n").getMidi()).toMatchObject([{ tick: 0, pitch: 60 }]);
		});

		it("includes durationTicks and velocity", () => {
			const result = note("C4", "4n", { velocity: 80 }).getMidi();
			expect(result[0].durationTicks).toBe(480);
			expect(result[0].velocity).toBe(80);
		});

		it("includes lyric when set", () => {
			const result = note("C4", "4n", { lyric: "hello" }).getMidi();
			expect(result[0].lyric).toBe("hello");
		});

		it("includes trackName when provided", () => {
			const result = note("C4", "4n").getMidi(0, "bass");
			expect(result[0].trackName).toBe("bass");
		});
	});
});
