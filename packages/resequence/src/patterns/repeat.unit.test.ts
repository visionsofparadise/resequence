import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import type { NotePattern } from "./note";
import { note } from "./note";
import { repeat, RepeatPattern } from "./repeat";
import { sequence, SequencePattern } from "./sequence";

describe("RepeatPattern", () => {
	describe("validation", () => {
		it("rejects count less than 1", () => {
			expect(() => repeat(note("C4", "4n"), 0)).toThrow(ResequenceError);
			expect(() => repeat(note("C4", "4n"), 0)).toThrow("count must be a positive integer");
		});

		it("rejects negative count", () => {
			expect(() => repeat(note("C4", "4n"), -2)).toThrow(ResequenceError);
		});

		it("rejects non-integer count", () => {
			expect(() => repeat(note("C4", "4n"), 2.5)).toThrow(ResequenceError);
			expect(() => repeat(note("C4", "4n"), 2.5)).toThrow("count must be a positive integer");
		});

		it("accepts count of 1", () => {
			expect(repeat(note("C4", "4n"), 1).durationTicks).toBe(480);
		});
	});

	describe("durationTicks", () => {
		it("multiplies child duration by count", () => {
			expect(repeat(note("C4", "4n"), 4).durationTicks).toBe(1920);
		});
	});

	describe("transpose", () => {
		it("transposes repeat child", () => {
			const result = repeat(note("C4", "4n"), 4).transpose(5) as RepeatPattern;
			expect(result.type).toBe("repeat");
			expect(result.count).toBe(4);
			expect((result.node as NotePattern).pitch).toBe(65);
		});
	});

	describe("reverse", () => {
		it("reverses repeat child", () => {
			const seq = sequence(note("C4", "4n"), note("E4", "4n"));
			const result = repeat(seq, 4).reverse() as RepeatPattern;
			expect(result.count).toBe(4);
			const inner = result.node as SequencePattern;
			expect((inner.children[0] as NotePattern).pitch).toBe("E4");
			expect((inner.children[1] as NotePattern).pitch).toBe("C4");
		});
	});

	describe("getMidi", () => {
		it("multiplies offsets", () => {
			const pat = repeat(note("C4", "4n"), 4);
			expect(pat.getMidi()).toMatchObject([
				{ tick: 0, pitch: 60 },
				{ tick: 480, pitch: 60 },
				{ tick: 960, pitch: 60 },
				{ tick: 1440, pitch: 60 },
			]);
		});

		it("handles repeat of a sequence", () => {
			const pat = repeat(sequence(note("C4", "8n"), note("E4", "8n")), 2);
			expect(pat.getMidi()).toMatchObject([
				{ tick: 0, pitch: 60 },
				{ tick: 240, pitch: 64 },
				{ tick: 480, pitch: 60 },
				{ tick: 720, pitch: 64 },
			]);
		});
	});
});
