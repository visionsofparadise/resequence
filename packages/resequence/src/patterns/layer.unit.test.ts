import { describe, expect, it } from "vitest";
import { layer, LayerPattern } from "./layer";
import type { NotePattern } from "./note";
import { note } from "./note";
import { sequence, SequencePattern } from "./sequence";

describe("LayerPattern", () => {
	describe("durationTicks", () => {
		it("uses max child duration", () => {
			expect(layer(note("C4", "4n"), note("E4", "2n")).durationTicks).toBe(960);
		});

		it("returns 0 for empty layer", () => {
			expect(layer().durationTicks).toBe(0);
		});

		it("uses duration override when provided", () => {
			const result = new LayerPattern([note("C4", "4n")], "1n");
			expect(result.durationTicks).toBe(1920);
		});
	});

	describe("transpose", () => {
		it("transposes layer children", () => {
			const result = layer(note("C4", "4n"), note("E4", "4n")).transpose(7) as LayerPattern;
			expect(result.type).toBe("layer");
			expect((result.nodes[0] as NotePattern).pitch).toBe(67);
			expect((result.nodes[1] as NotePattern).pitch).toBe(71);
		});
	});

	describe("reverse", () => {
		it("reverses each layer child individually", () => {
			const seq1 = sequence(note("C4", "4n"), note("D4", "4n"));
			const seq2 = sequence(note("E4", "4n"), note("F4", "4n"));
			const result = layer(seq1, seq2).reverse() as LayerPattern;
			const reversed1 = result.nodes[0] as SequencePattern;
			const reversed2 = result.nodes[1] as SequencePattern;
			expect((reversed1.nodes[0] as NotePattern).pitch).toBe("D4");
			expect((reversed1.nodes[1] as NotePattern).pitch).toBe("C4");
			expect((reversed2.nodes[0] as NotePattern).pitch).toBe("F4");
			expect((reversed2.nodes[1] as NotePattern).pitch).toBe("E4");
		});
	});

	describe("getMidi", () => {
		it("places children at the same offset", () => {
			const pat = layer(note("C4", "4n"), note("E4", "4n"), note("G4", "4n"));
			expect(pat.getMidi()).toMatchObject([
				{ tick: 0, pitch: 60 },
				{ tick: 0, pitch: 64 },
				{ tick: 0, pitch: 67 },
			]);
		});

		it("returns empty for empty layer", () => {
			expect(layer().getMidi()).toEqual([]);
		});
	});
});
