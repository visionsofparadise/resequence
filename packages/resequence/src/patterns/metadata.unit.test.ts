import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { sampler } from "../nodes/generators/sampler";
import { gap } from "./gap";
import { layer } from "./layer";
import { metadata, MetadataPattern } from "./metadata";
import type { NotePattern } from "./note";
import { note } from "./note";
import { repeat } from "./repeat";
import type { SequencePattern } from "./sequence";
import { sequence } from "./sequence";

describe("MetadataPattern", () => {
	describe("validation", () => {
		it("rejects tempo <= 0", () => {
			expect(() => metadata(note("C4", "4n"), { tempo: 0 })).toThrow(ResequenceError);
			expect(() => metadata(note("C4", "4n"), { tempo: -10 })).toThrow("tempo must be greater than 0");
		});

		it("rejects non-integer time signature numerator", () => {
			expect(() => metadata(note("C4", "4n"), { timeSignature: [4.5, 4] })).toThrow(ResequenceError);
			expect(() => metadata(note("C4", "4n"), { timeSignature: [4.5, 4] })).toThrow("time signature values must be positive integers");
		});

		it("rejects zero time signature denominator", () => {
			expect(() => metadata(note("C4", "4n"), { timeSignature: [4, 0] })).toThrow(ResequenceError);
		});

		it("rejects negative time signature values", () => {
			expect(() => metadata(note("C4", "4n"), { timeSignature: [-1, 4] })).toThrow(ResequenceError);
		});

		it("accepts valid metadata", () => {
			expect(metadata(note("C4", "4n"), { tempo: 120, timeSignature: [3, 4] }).tempo).toBe(120);
		});
	});

	describe("creation", () => {
		it("wraps pattern with all metadata fields", () => {
			const m = metadata(note("C4", "4n"), { tempo: 126, key: "Cm", timeSignature: [4, 4] });
			expect(m.type).toBe("metadata");
			expect(m.tempo).toBe(126);
			expect(m.key).toBe("Cm");
			expect(m.timeSignature).toEqual([4, 4]);
		});

		it("supports partial metadata", () => {
			const m = metadata(note("C4", "4n"), { tempo: 140 });
			expect(m.tempo).toBe(140);
			expect(m.key).toBeUndefined();
			expect(m.timeSignature).toBeUndefined();
		});
	});

	describe("durationTicks", () => {
		it("delegates to child", () => {
			const m = metadata(note("C4", "4n"), { tempo: 120 });
			expect(m.durationTicks).toBe(480);
		});

		it("delegates sequence duration", () => {
			const m = metadata(sequence(note("C4", "4n"), note("E4", "4n")), { tempo: 120 });
			expect(m.durationTicks).toBe(960);
		});
	});

	describe("transpose", () => {
		it("transposes child, preserves metadata", () => {
			const m = metadata(note("C4", "4n"), { tempo: 126, key: "Cm" });
			const transposed = m.transpose(7);
			expect(transposed).toBeInstanceOf(MetadataPattern);
			expect(transposed.tempo).toBe(126);
			expect(transposed.key).toBe("Cm");
			expect((transposed.node as NotePattern).pitch).toBe(67);
		});
	});

	describe("reverse", () => {
		it("reverses child, preserves metadata", () => {
			const m = metadata(sequence(note("C4", "4n"), note("E4", "4n")), { tempo: 126 });
			const reversed = m.reverse();
			expect(reversed).toBeInstanceOf(MetadataPattern);
			expect(reversed.tempo).toBe(126);
			const inner = reversed.node as SequencePattern;
			expect((inner.children[0] as NotePattern).pitch).toBe("E4");
			expect((inner.children[1] as NotePattern).pitch).toBe("C4");
		});
	});

	describe("getMidi", () => {
		it("delegates to child", () => {
			const pat = metadata(note("C4", "4n"), { tempo: 120 });
			expect(pat.getMidi()).toMatchObject([{ tick: 0, pitch: 60 }]);
		});

		it("handles nested structures", () => {
			const inst = sampler("drums", "./kick.wav", { root: "C1" });
			const kick = repeat(note("C1", "4n"), 4).route(inst);
			const snare = sequence(gap("4n"), note("D1", "4n"), gap("4n"), note("D1", "4n"));
			const groove = layer(kick, snare);
			const song = metadata(groove, { tempo: 120 });

			expect(song.getMidi()).toMatchObject([
				{ tick: 0, pitch: 24 },
				{ tick: 480, pitch: 24 },
				{ tick: 960, pitch: 24 },
				{ tick: 1440, pitch: 24 },
				{ tick: 480, pitch: 26 },
				{ tick: 1440, pitch: 26 },
			]);
		});
	});
});
